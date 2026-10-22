import mineflayer, { Bot } from 'mineflayer';
import { prisma } from '@mineafk/database';
import { startAfk, stopAfk } from '../afk/runner';
import { createReconnectManager } from '../reconnect/manager';

interface BotInstance {
  bot: Bot;
  botId: string;
  reconnect: ReturnType<typeof createReconnectManager>;
  startTime: number;
}

const active = new Map<string, BotInstance>();

export function getActiveBots() {
  return Array.from(active.keys());
}

async function updateStatus(botId: string, status: string, extra: Record<string, any> = {}) {
  await prisma.bot.update({
    where: { id: botId },
    data: { status: status as any },
  });

  if (Object.keys(extra).length) {
    await prisma.botRuntimeState.upsert({
      where: { botId },
      create: { botId, ...extra },
      update: extra,
    });
  }
}

async function log(botId: string, level: string, message: string) {
  await prisma.botLog.create({
    data: { botId, level, message },
  });
  // Keep only last 500 logs per bot (simple retention)
  const count = await prisma.botLog.count({ where: { botId } });
  if (count > 500) {
    const old = await prisma.botLog.findMany({
      where: { botId },
      orderBy: { createdAt: 'asc' },
      take: count - 500,
      select: { id: true },
    });
    await prisma.botLog.deleteMany({
      where: { id: { in: old.map((o) => o.id) } },
    });
  }
}

export async function createBot(data: any) {
  const { botId, account, server, afk, autoReconnect, reconnectDelayMs, maxReconnects } = data;

  if (active.has(botId)) {
    console.log(`Bot ${botId} already active`);
    return;
  }

  await updateStatus(botId, 'STARTING');
  await log(botId, 'info', `Starting bot as ${account.username} → ${server.host}:${server.port}`);

  const options: any = {
    host: server.host,
    port: server.port,
    username: account.username,
    version: server.version || false,
    hideErrors: false,
  };

  // Offline mode
  if (account.type === 'OFFLINE' || server.authMode === 'offline') {
    options.auth = 'offline';
  } else {
    // Premium would use accessToken here (decrypted)
    // options.auth = 'microsoft';
    // options.accessToken = decryptedToken;
    await updateStatus(botId, 'AUTH_REQUIRED', {
      errorMessage: 'Premium Microsoft auth not fully configured in this free-tier build',
    });
    await log(botId, 'error', 'Premium accounts require Microsoft OAuth tokens. Use offline mode for testing.');
    return;
  }

  await updateStatus(botId, 'CONNECTING');

  let bot: Bot;
  try {
    bot = mineflayer.createBot(options);
  } catch (e: any) {
    await updateStatus(botId, 'FAILED', { errorMessage: e.message });
    await log(botId, 'error', `Failed to create bot: ${e.message}`);
    return;
  }

  const reconnect = createReconnectManager({
    botId,
    maxRetries: maxReconnects || 20,
    initialDelay: reconnectDelayMs || 5000,
    onReconnect: async () => {
      if (autoReconnect) {
        await stopBot(botId);
        // re-queue would happen via API in full system
      }
    },
  });

  const instance: BotInstance = {
    bot,
    botId,
    reconnect,
    startTime: Date.now(),
  };
  active.set(botId, instance);

  bot.on('login', async () => {
    await updateStatus(botId, 'ONLINE', {
      connectedAt: new Date(),
      protocolVersion: String(bot.version),
      errorMessage: null,
    });
    await log(botId, 'info', `Logged in as ${bot.username}`);
    await prisma.connectionEvent.create({
      data: { botId, type: 'connected' },
    });

    if (afk) {
      startAfk(bot, afk);
    }
  });

  bot.on('spawn', async () => {
    await log(botId, 'info', 'Spawned in world');
  });

  bot.on('error', async (err) => {
    await log(botId, 'error', err.message);
  });

  bot.on('kicked', async (reason) => {
    const reasonStr = typeof reason === 'string' ? reason : JSON.stringify(reason);
    await log(botId, 'warn', `Kicked: ${reasonStr}`);
    await updateStatus(botId, 'STOPPED', {
      lastDisconnectAt: new Date(),
      lastDisconnectReason: reasonStr,
    });
    await prisma.connectionEvent.create({
      data: { botId, type: 'disconnected', reason: reasonStr },
    });
    cleanup(botId);
  });

  bot.on('end', async (reason) => {
    await log(botId, 'info', `Disconnected: ${reason || 'unknown'}`);
    const uptime = Math.floor((Date.now() - instance.startTime) / 1000);
    await updateStatus(botId, 'STOPPED', {
      lastDisconnectAt: new Date(),
      lastDisconnectReason: reason || 'end',
      totalUptimeSeconds: { increment: uptime } as any,
    });
    cleanup(botId);

    if (autoReconnect && reason !== 'disconnect.quitting') {
      reconnect.schedule();
    }
  });

  // Periodic ping update
  const pingInterval = setInterval(async () => {
    if (!active.has(botId)) {
      clearInterval(pingInterval);
      return;
    }
    try {
      const ping = (bot as any).player?.ping ?? null;
      if (ping != null) {
        await prisma.botRuntimeState.update({
          where: { botId },
          data: { lastPingMs: ping },
        });
      }
    } catch {}
  }, 15000);
}

function cleanup(botId: string) {
  const inst = active.get(botId);
  if (inst) {
    stopAfk(inst.bot);
    try {
      inst.bot.quit();
    } catch {}
    active.delete(botId);
  }
}

export async function stopBot(botId: string) {
  const inst = active.get(botId);
  if (!inst) {
    await updateStatus(botId, 'STOPPED');
    return;
  }

  await updateStatus(botId, 'STOPPING');
  await log(botId, 'info', 'Stopping bot by user request');
  inst.reconnect.cancel();
  stopAfk(inst.bot);

  try {
    inst.bot.quit('disconnect.quitting');
  } catch {}

  active.delete(botId);
  await updateStatus(botId, 'STOPPED');
}
