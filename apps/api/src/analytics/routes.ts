import { FastifyInstance } from 'fastify';
import { prisma } from '@mineafk/database';
import { requireAuth } from '../common/auth';

export async function analyticsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/overview', async (req, reply) => {
    const user = (req as any).user;

    const bots = await prisma.bot.findMany({
      where: { userId: user.id, deletedAt: null },
      include: { runtimeState: true },
    });

    const totalUptime = bots.reduce(
      (sum, b) => sum + Number(b.runtimeState?.totalUptimeSeconds || 0),
      0
    );

    const online = bots.filter((b) => b.status === 'ONLINE').length;
    const failed = bots.filter((b) => b.status === 'FAILED').length;

    const events = await prisma.connectionEvent.count({
      where: { bot: { userId: user.id } },
    });

    return reply.send({
      totalBots: bots.length,
      online,
      failed,
      totalUptimeSeconds: totalUptime,
      totalEvents: events,
    });
  });

  app.get('/bots/:id', async (req, reply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };

    const bot = await prisma.bot.findFirst({
      where: { id, userId: user.id, deletedAt: null },
      include: {
        runtimeState: true,
        events: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!bot) return reply.status(404).send({ error: 'Bot not found' });

    return reply.send({
      uptimeSeconds: Number(bot.runtimeState?.totalUptimeSeconds || 0),
      reconnectCount: bot.runtimeState?.reconnectCount || 0,
      lastPing: bot.runtimeState?.lastPingMs,
      events: bot.events,
    });
  });
}
