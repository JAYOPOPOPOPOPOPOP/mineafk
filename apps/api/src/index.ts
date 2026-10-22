import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { authRoutes } from './auth/routes';
import { userRoutes } from './users/routes';
import { accountRoutes } from './minecraft-accounts/routes';
import { serverRoutes } from './servers/routes';
import { botRoutes } from './bots/routes';
import { scheduleRoutes } from './schedules/routes';
import { analyticsRoutes } from './analytics/routes';
import { notificationRoutes } from './notifications/routes';
import { adminRoutes } from './admin/routes';
import { healthRoutes } from './common/health';
import { wsHandler } from './common/websocket';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  trustProxy: true,
});

async function bootstrap() {
  await app.register(helmet, {
    contentSecurityPolicy: false, // adjust for production
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || process.env.WEB_URL || true,
    credentials: true,
  });

  await app.register(cookie, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
  });

  await app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  });

  await app.register(websocket);

  // Routes
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(accountRoutes, { prefix: '/api/minecraft/accounts' });
  await app.register(serverRoutes, { prefix: '/api/servers' });
  await app.register(botRoutes, { prefix: '/api/bots' });
  await app.register(scheduleRoutes, { prefix: '/api/schedules' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(adminRoutes, { prefix: '/api/admin' });

  // WebSocket for live console
  app.get('/ws', { websocket: true }, wsHandler);

  const port = Number(process.env.PORT) || 3001;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen({ port, host });
  console.log(`MineAFK API running on http://${host}:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
