import { FastifyInstance } from 'fastify';
import net from 'net';
import { prisma } from '@mineafk/database';
import { serverSchema, PRIVATE_IP_RANGES } from '@mineafk/shared';
import { requireAuth } from '../common/auth';

function isPrivateHost(host: string): boolean {
  return PRIVATE_IP_RANGES.some((r) => r.test(host));
}

async function testTcpConnection(host: string, port: number, timeoutMs = 5000): Promise<{ ok: boolean; error?: string }> {
  if (isPrivateHost(host)) {
    return { ok: false, error: 'Private/internal addresses are blocked' };
  }

  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timer = setTimeout(() => {
      socket.destroy();
      resolve({ ok: false, error: 'Connection timeout' });
    }, timeoutMs);

    socket.connect(port, host, () => {
      clearTimeout(timer);
      socket.destroy();
      resolve({ ok: true });
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, error: err.message });
    });
  });
}

export async function serverRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (req, reply) => {
    const user = (req as any).user;
    const servers = await prisma.serverConfiguration.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ servers });
  });

  app.post('/', async (req, reply) => {
    const user = (req as any).user;
    const body = serverSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    if (isPrivateHost(body.data.host)) {
      return reply.status(400).send({ error: 'Private/internal network addresses are not allowed' });
    }

    const server = await prisma.serverConfiguration.create({
      data: {
        userId: user.id,
        ...body.data,
      },
    });
    return reply.status(201).send({ server });
  });

  app.patch('/:id', async (req, reply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };
    const body = serverSchema.partial().safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const existing = await prisma.serverConfiguration.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });
    if (!existing) return reply.status(404).send({ error: 'Server not found' });

    if (body.data.host && isPrivateHost(body.data.host)) {
      return reply.status(400).send({ error: 'Private addresses not allowed' });
    }

    const server = await prisma.serverConfiguration.update({
      where: { id },
      data: body.data,
    });
    return reply.send({ server });
  });

  app.delete('/:id', async (req, reply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };

    const existing = await prisma.serverConfiguration.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });
    if (!existing) return reply.status(404).send({ error: 'Server not found' });

    await prisma.serverConfiguration.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return reply.send({ ok: true });
  });

  // Test connectivity
  app.post('/:id/test', async (req, reply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };

    const server = await prisma.serverConfiguration.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });
    if (!server) return reply.status(404).send({ error: 'Server not found' });

    const result = await testTcpConnection(server.host, server.port);

    await prisma.serverConfiguration.update({
      where: { id },
      data: {
        lastTestAt: new Date(),
        lastTestSuccess: result.ok,
        lastTestError: result.error || null,
      },
    });

    return reply.send({
      success: result.ok,
      error: result.error || null,
      testedAt: new Date().toISOString(),
    });
  });
}
