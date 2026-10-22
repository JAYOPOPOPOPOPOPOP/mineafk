import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma, Role } from '@mineafk/database';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';

export interface JwtPayload {
  userId: string;
  role: Role;
}

export function signToken(payload: JwtPayload, expiresIn = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  const user = await prisma.user.findFirst({
    where: { id: payload.userId, deletedAt: null, isSuspended: false },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      planId: true,
      timezone: true,
    },
  });

  if (!user) {
    return reply.status(401).send({ error: 'User not found or suspended' });
  }

  (req as any).user = user;
}

export function requireRole(...roles: Role[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;

    const user = (req as any).user;
    if (!roles.includes(user.role)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
  };
}

export async function getUserPlanLimits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { plan: true },
  });

  if (user?.plan) return user.plan;

  // Fallback to default Free plan
  const free = await prisma.subscriptionPlan.findFirst({ where: { isDefault: true } });
  return (
    free || {
      maxBots: 2,
      maxConcurrentBots: 1,
      maxWorkerRamMb: 256,
      schedulingEnabled: false,
    }
  );
}
