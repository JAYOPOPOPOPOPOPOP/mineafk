import { FastifyInstance } from 'fastify';
import { prisma } from '@mineafk/database';
import { requireAuth } from '../common/auth';

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (req, reply) => {
    const user = (req as any).user;
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return reply.send({ notifications });
  });

  app.post('/read-all', async (req, reply) => {
    const user = (req as any).user;
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return reply.send({ ok: true });
  });

  app.delete('/:id', async (req, reply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };
    await prisma.notification.deleteMany({ where: { id, userId: user.id } });
    return reply.send({ ok: true });
  });
}
