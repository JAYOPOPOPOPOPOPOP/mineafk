import { FastifyInstance } from 'fastify';
import { prisma } from '@mineafk/database';
import { scheduleSchema } from '@mineafk/shared';
import { requireAuth, getUserPlanLimits } from '../common/auth';

export async function scheduleRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (req, reply) => {
    const user = (req as any).user;
    const schedules = await prisma.botSchedule.findMany({
      where: { userId: user.id },
      include: { bot: { select: { id: true, name: true } } },
    });
    return reply.send({ schedules });
  });

  app.post('/', async (req, reply) => {
    const user = (req as any).user;
    const limits = await getUserPlanLimits(user.id);
    if (!limits.schedulingEnabled) {
      return reply.status(403).send({ error: 'Scheduling not available on your plan' });
    }

    const body = scheduleSchema.safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const bot = await prisma.bot.findFirst({
      where: { id: body.data.botId, userId: user.id, deletedAt: null },
    });
    if (!bot) return reply.status(400).send({ error: 'Invalid bot' });

    const schedule = await prisma.botSchedule.create({
      data: {
        userId: user.id,
        ...body.data,
      },
    });
    return reply.status(201).send({ schedule });
  });

  app.delete('/:id', async (req, reply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };
    await prisma.botSchedule.deleteMany({ where: { id, userId: user.id } });
    return reply.send({ ok: true });
  });
}
