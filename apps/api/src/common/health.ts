import { FastifyInstance } from 'fastify';
import { prisma } from '@mineafk/database';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.send({
        status: 'ok',
        service: 'mineafk-api',
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      return reply.status(503).send({ status: 'error', message: 'Database unavailable' });
    }
  });

  app.get('/', async (_req, reply) => {
    return reply.send({ name: 'MineAFK Cloud API', version: '1.0.0' });
  });
}
