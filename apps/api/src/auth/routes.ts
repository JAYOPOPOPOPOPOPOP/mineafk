import { FastifyInstance } from 'fastify';
import argon2 from 'argon2';
import { prisma } from '@mineafk/database';
import { registerSchema, loginSchema } from '@mineafk/shared';
import { signToken, requireAuth } from '../common/auth';

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post('/register', async (req, reply) => {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const { email, password, displayName } = body.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(409).send({ error: 'Email already registered' });
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const freePlan = await prisma.subscriptionPlan.findFirst({
      where: { isDefault: true },
    });

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName || email.split('@')[0],
        planId: freePlan?.id,
      },
      select: { id: true, email: true, displayName: true, role: true },
    });

    const token = signToken({ userId: user.id, role: user.role });

    reply
      .setCookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })
      .send({ user, token });
  });

  // Login
  app.post('/login', async (req, reply) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const { email, password } = body.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt || user.isSuspended) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = signToken({ userId: user.id, role: user.role });

    reply
      .setCookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })
      .send({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        token,
      });
  });

  // Logout
  app.post('/logout', async (_req, reply) => {
    reply.clearCookie('token', { path: '/' }).send({ ok: true });
  });

  // Me
  app.get('/me', { preHandler: requireAuth }, async (req, reply) => {
    const user = (req as any).user;
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        timezone: true,
        language: true,
        emailVerified: true,
        twoFactorEnabled: true,
        plan: {
          select: {
            name: true,
            maxBots: true,
            maxConcurrentBots: true,
            schedulingEnabled: true,
          },
        },
        createdAt: true,
      },
    });
    return reply.send({ user: full });
  });
}
