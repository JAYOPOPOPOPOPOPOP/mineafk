import { FastifyInstance } from 'fastify';
import { prisma, Role } from '@mineafk/database';
import { requireRole } from '../common/auth';

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireRole(Role.ADMIN, Role.SUPER_ADMIN));

  app.get('/overview', async (_req, reply) => {
    const [users, bots, onlineBots, failedBots] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.bot.count({ where: { deletedAt: null } }),
      prisma.bot.count({ where: { status: 'ONLINE', deletedAt: null } }),
      prisma.bot.count({ where: { status: 'FAILED', deletedAt: null } }),
    ]);

    return reply.send({
      totalUsers: users,
      totalBots: bots,
      onlineBots,
      failedBots,
    });
  });

  app.get('/users', async (req, reply) => {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isSuspended: true,
        createdAt: true,
        plan: { select: { name: true } },
        _count: { select: { bots: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return reply.send({ users });
  });

  app.patch('/users/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { isSuspended } = req.body as { isSuspended: boolean };

    await prisma.user.update({
      where: { id },
      data: { isSuspended },
    });

    await prisma.securityAuditLog.create({
      data: {
        actorId: (req as any).user.id,
        action: isSuspended ? 'SUSPEND_USER' : 'RESTORE_USER',
        targetType: 'User',
        targetId: id,
        outcome: 'success',
      },
    });

    return reply.send({ ok: true });
  });

  app.get('/bots', async (_req, reply) => {
    const bots = await prisma.bot.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { email: true } },
        account: { select: { username: true, type: true } },
        server: { select: { host: true, port: true } },
        runtimeState: true,
      },
      take: 100,
      orderBy: { updatedAt: 'desc' },
    });
    return reply.send({ bots });
  });
}
