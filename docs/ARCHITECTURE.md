# Architecture

- **apps/web** — Next.js dashboard
- **apps/api** — Fastify REST + WebSocket
- **apps/workers/minecraft-worker** — Mineflayer bots (BullMQ consumer)
- **packages/database** — Prisma + PostgreSQL
- **packages/shared** — Zod validators + types

Flow: Browser → API → Redis queue → Worker → Minecraft server
