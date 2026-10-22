import { FastifyInstance } from 'fastify';
import { prisma } from '@mineafk/database';
import { requireAuth } from '../common/auth';

export async function userRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.patch('/profile', async (req, reply) => {
    const user = (req as any).user;
    const { displayName, timezone, language } = req.body as any;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(displayName && { displayName }),
        ...(timezone && { timezone }),
        ...(language && { language }),
      },
      select: { id: true, displayName: true, timezone: true, language: true },
    });
    return reply.send({ user: updated });
  });
}
