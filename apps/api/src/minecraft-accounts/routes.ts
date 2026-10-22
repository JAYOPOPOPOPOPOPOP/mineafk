import { FastifyInstance } from 'fastify';
import { prisma } from '@mineafk/database';
import { offlineAccountSchema } from '@mineafk/shared';
import { requireAuth } from '../common/auth';

export async function accountRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  // List accounts
  app.get('/', async (req, reply) => {
    const user = (req as any).user;
    const accounts = await prisma.minecraftAccount.findMany({
      where: { userId: user.id, deletedAt: null },
      select: {
        id: true,
        type: true,
        label: true,
        username: true,
        uuid: true,
        skinUrl: true,
        description: true,
        isActive: true,
        createdAt: true,
        // Never return tokens
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ accounts });
  });

  // Create offline / cracked account
  app.post('/offline', async (req, reply) => {
    const user = (req as any).user;
    const body = offlineAccountSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    if (process.env.ENABLE_OFFLINE_ACCOUNTS === 'false') {
      return reply.status(403).send({ error: 'Offline accounts are disabled' });
    }

    const { username, label, description } = body.data;

    // Check quota (simple)
    const count = await prisma.minecraftAccount.count({
      where: { userId: user.id, deletedAt: null },
    });
    if (count >= 10) {
      return reply.status(403).send({ error: 'Account limit reached' });
    }

    const existing = await prisma.minecraftAccount.findFirst({
      where: { userId: user.id, username, type: 'OFFLINE', deletedAt: null },
    });
    if (existing) {
      return reply.status(409).send({ error: 'This offline username already exists' });
    }

    const account = await prisma.minecraftAccount.create({
      data: {
        userId: user.id,
        type: 'OFFLINE',
        username,
        label: label || username,
        description,
      },
      select: {
        id: true,
        type: true,
        label: true,
        username: true,
        description: true,
        createdAt: true,
      },
    });

    return reply.status(201).send({
      account,
      warning:
        'Offline-mode accounts only work on servers that allow offline authentication. This does not prove ownership of the Minecraft name.',
    });
  });

  // Microsoft connect placeholder (requires real Azure app credentials)
  app.post('/microsoft/connect', async (req, reply) => {
    if (process.env.ENABLE_PREMIUM_ACCOUNTS === 'false') {
      return reply.status(403).send({ error: 'Premium accounts are disabled' });
    }

    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
      return reply.status(501).send({
        error:
          'Microsoft authentication is not configured. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in environment variables. See README.',
      });
    }

    // Real implementation would redirect to Microsoft OAuth
    // For Railway demo we return a clear message
    return reply.status(501).send({
      error:
        'Microsoft OAuth flow requires Azure App Registration. Configure credentials and implement the full OAuth callback. Tokens must be encrypted at rest.',
      docs: 'https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow',
    });
  });

  // Delete account
  app.delete('/:id', async (req, reply) => {
    const user = (req as any).user;
    const { id } = req.params as { id: string };

    const account = await prisma.minecraftAccount.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });
    if (!account) {
      return reply.status(404).send({ error: 'Account not found' });
    }

    // Soft delete
    await prisma.minecraftAccount.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return reply.send({ ok: true });
  });
}
