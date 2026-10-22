import { FastifyInstance } from 'fastify';
import { prisma } from '@mineafk/database';
import { botSchema } from '@mineafk/shared';
import { requireAuth, getUserPlanLimits } from '../common/auth';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

let botQueue: Queue | null = null;

function getQueue() {
  if (!botQueue) {
    const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
    botQueue = new Queue('bot-commands', { connection });
  }
  return botQueue;
}

export async function botRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // List bots
  app.get('/', async (req, reply) => {
    const user = (req as any).user;
    const bots = await prisma.bot.findMany({
      where: { userId: user.id, deletedAt: null },
      include: {
        account: {
          select: { id: true, type: true, username: true, label: true },
        },
        server: {
          select: { id: true, displayName: true, host: true, port: true, version: true },
        },
        runtimeState: true,
        afkProfile: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ bots });
  });

  // Create bot
  app.post('/', async (req, reply) => {
    const user = (req as any).user;
    const body = botSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const limits = await getUserPlanLimits(user.id);
    const botCount = await prisma.bot.count({
      where: { userId: user.id, deletedAt: null },
    });
    if (botCount >= limits.maxBots) {
      return reply.status(403).send({
        error: `Plan limit reached. Max bots: ${limits.maxBots}`,
      });
    }

    // Ownership checks
    const account = await prisma.minecraftAccount.findFirst({
      where: { id: body.data.accountId, userId: user.id, deletedAt: null },
    });
    if (!account) return reply.status(400).send({ error: 'Invalid account' });

    const server = await prisma.serverConfiguration.findFirst({
      where: { id: body.data.serverId, userId: user.id, deletedAt: null },
    });
    if (!server) return reply.status(400).send({ error: 'Invalid server' });

    // Offline account only on offline-allowed servers
    if (account.type === 'OFFLINE' && server.authMode === 'online') {
      return reply.status(400).send({
        error: 'Offline accounts can only be used with servers configured for offline mode',
      });
    }

    const bot = await prisma.bot.create({
      data: {
        userId: user.id,
        name: body.data.name,
        accountId: body.data.accountId,
        serverId: body.data.serverId,
        afkProfileId: body.data.afkProfileId,
        autoReconnect: body.data.autoReconnect,
        autoStart: body.data.autoStart,
        reconnectDelayMs: body.data.reconnectDelayMs,
        maxReconnects: body.data.maxReconnects,
        status: 'CREATED',
      },
      include: {
        account: { select: { type: true, username: true } },
        server: { select: { displayName: true, host: true, port: true } },
      },
    });

    await prisma.botRuntimeState.create({
      data: { botId: bot.id },
    });

    return reply.status(201).send({ bot });
  });

  // Get single bot
  app.get('/:id', async (req, reply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };

    const bot = await prisma.bot.findFirst({
      where: { id, userId: user.id, deletedAt: null },
      include: {
        account: { select: { id: true, type: true, username: true, label: true, uuid: true } },
        server: true,
        runtimeState: true,
        afkProfile: true,
        events: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!bot) return reply.status(404).send({ error: 'Bot not found' });
    return reply.send({ bot });
  });

  // Start bot
  app.post('/:id/start', async (req, reply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };

    const bot = await prisma.bot.findFirst({
      where: { id, userId: user.id, deletedAt: null },
      include: { account: true, server: true, afkProfile: true },
    });
    if (!bot) return reply.status(404).send({ error: 'Bot not found' });

    if (['ONLINE', 'CONNECTING', 'STARTING'].includes(bot.status)) {
      return reply.status(400).send({ error: 'Bot is already running or starting' });
    }

    const limits = await getUserPlanLimits(user.id);
    const onlineCount = await prisma.bot.count({
      where: {
        userId: user.id,
        status: { in: ['ONLINE', 'CONNECTING', 'STARTING', 'RECONNECTING'] },
        deletedAt: null,
      },
    });
    if (onlineCount >= limits.maxConcurrentBots) {
      return reply.status(403).send({
        error: `Concurrent bot limit reached (${limits.maxConcurrentBots})`,
      });
    }

    await prisma.bot.update({
      where: { id },
      data: { status: 'QUEUED' },
    });

    // Push to worker queue
    try {
      const queue = getQueue();
      await queue.add('start', {
        botId: id,
        userId: user.id,
        account: {
          type: bot.account.type,
          username: bot.account.username,
          // tokens would be decrypted here in real premium flow
        },
        server: {
          host: bot.server.host,
          port: bot.server.port,
          version: bot.server.version,
          authMode: bot.server.authMode,
        },
        afk: bot.afkProfile?.actions || null,
        autoReconnect: bot.autoReconnect,
        reconnectDelayMs: bot.reconnectDelayMs,
        maxReconnects: bot.maxReconnects,
      });
    } catch (e: any) {
      await prisma.bot.update({ where: { id }, data: { status: 'FAILED' } });
      return reply.status(500).send({ error: 'Failed to queue bot: ' + e.message });
    }

    return reply.send({ ok: true, status: 'QUEUED' });
  });

  // Stop bot
  app.post('/:id/stop', async (req, reply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };

    const bot = await prisma.bot.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });
    if (!bot) return reply.status(404).send({ error: 'Bot not found' });

    await prisma.bot.update({
      where: { id },
      data: { status: 'STOPPING' },
    });

    try {
      const queue = getQueue();
      await queue.add('stop', { botId: id });
    } catch (e: any) {
      // still mark stopped
    }

    await prisma.bot.update({
      where: { id },
      data: { status: 'STOPPED' },
    });

    return reply.send({ ok: true, status: 'STOPPED' });
  });

  // Restart
  app.post('/:id/restart', async (req, reply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };

    const bot = await prisma.bot.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });
    if (!bot) return reply.status(404).send({ error: 'Bot not found' });

    try {
      const queue = getQueue();
      await queue.add('restart', { botId: id });
    } catch (e: any) {
      return reply.status(500).send({ error: e.message });
    }

    return reply.send({ ok: true, status: 'RESTARTING' });
  });

  // Delete
  app.delete('/:id', async (req, reply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };

    const bot = await prisma.bot.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });
    if (!bot) return reply.status(404).send({ error: 'Bot not found' });

    // Stop first
    try {
      const queue = getQueue();
      await queue.add('stop', { botId: id });
    } catch {}

    await prisma.bot.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'STOPPED' },
    });

    return reply.send({ ok: true });
  });

  // Logs
  app.get('/:id/logs', async (req, reply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };

    const bot = await prisma.bot.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });
    if (!bot) return reply.status(404).send({ error: 'Bot not found' });

    const logs = await prisma.botLog.findMany({
      where: { botId: id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return reply.send({ logs: logs.reverse() });
  });
}
