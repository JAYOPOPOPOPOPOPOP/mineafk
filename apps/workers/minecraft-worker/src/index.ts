import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@mineafk/database';
import { createBot, stopBot, getActiveBots } from './bot/manager';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const concurrency = Number(process.env.WORKER_CONCURRENCY) || 2;

console.log(`MineAFK Worker starting (concurrency=${concurrency})`);

const worker = new Worker(
  'bot-commands',
  async (job: Job) => {
    const { name, data } = job;
    console.log(`[Worker] Job ${name}`, data.botId);

    switch (name) {
      case 'start':
        await createBot(data);
        break;
      case 'stop':
        await stopBot(data.botId);
        break;
      case 'restart':
        await stopBot(data.botId);
        // re-fetch and start would be needed; simplified
        break;
      default:
        console.warn('Unknown job', name);
    }
  },
  { connection, concurrency }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down worker...');
  for (const botId of getActiveBots()) {
    await stopBot(botId);
  }
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Heartbeat
setInterval(async () => {
  try {
    // Could update Worker table
  } catch {}
}, 30000);
