# MineAFK Cloud

Minecraft AFK bot hosting platform — optimized for **Railway.com**.

Persistent bots run in a dedicated worker process. Frontend (Next.js) + API (Fastify) + Mineflayer worker + PostgreSQL + Redis.

## Features implemented

- User registration / login (Argon2id + JWT cookies)
- Offline / cracked Minecraft accounts
- Premium account endpoint (requires your own Microsoft Azure credentials)
- Server configuration + TCP connectivity test (private IPs blocked)
- Bot create / start / stop / restart
- Real status updates + logs in DB
- AFK actions (jump, sneak, look, small move)
- Auto-reconnect with backoff
- Plan limits (Free: 2 bots, 1 concurrent)
- Admin overview endpoints
- Dark modern dashboard UI
- Docker Compose for local
- Railway-ready multi-service layout

## Limitations (honest)

1. **Microsoft Premium auth** is scaffolded only. You must create an Azure App Registration and implement the full OAuth + token encryption flow.
2. **Railway free tier** has credit limits and may sleep services. For true 24/7 use Railway Pro or a free always-on VPS (Oracle Cloud).
3. Schedules / full analytics charts / Discord webhooks are stubbed — core start/stop/logs work.
4. Single-worker in-memory bot map (fine for small scale on one Railway service).

## Project structure

```
mineafk-cloud/
├── apps/
│   ├── web/                 # Next.js frontend
│   ├── api/                 # Fastify REST + WebSocket
│   └── workers/
│       └── minecraft-worker # Mineflayer bots + BullMQ consumer
├── packages/
│   ├── database/            # Prisma schema + client
│   └── shared/              # Zod validators + types
├── infrastructure/docker/
├── docker-compose.yml
└── README.md
```

## Railway deployment (recommended path)

### 1. Create project on Railway

1. Go to https://railway.app → New Project
2. Deploy from GitHub (push this repo) **or** empty project + CLI

### 2. Add databases

- **PostgreSQL** plugin → copy `DATABASE_URL`
- **Redis** plugin → copy `REDIS_URL`

### 3. Create three services

| Service | Root directory / start | Notes |
|---------|------------------------|-------|
| **api** | `apps/api` or monorepo root | `npx tsx apps/api/src/index.ts` after install + prisma generate |
| **worker** | monorepo | `npx tsx apps/workers/minecraft-worker/src/index.ts` |
| **web** | `apps/web` | `npm run build && npm start` |

### 4. Environment variables (set on each service as needed)

```
DATABASE_URL=<from Railway Postgres>
REDIS_URL=<from Railway Redis>
JWT_SECRET=<long random string>
ENCRYPTION_KEY=<32+ char secret>
NODE_ENV=production
PORT=3001                    # api
CORS_ORIGIN=https://your-web.up.railway.app
WEB_URL=https://your-web.up.railway.app
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
ENABLE_OFFLINE_ACCOUNTS=true
MAX_BOTS_PER_USER=2
WORKER_CONCURRENCY=1
```

### 5. Database migrate

In the **api** service shell (or one-off):

```bash
cd packages/database
npx prisma db push
npx tsx src/seed.ts
```

### 6. Create Super Admin (one time)

```bash
SUPERADMIN_BOOTSTRAP_SECRET=your-long-secret \
npx tsx apps/api/src/scripts/create-superadmin.ts \
  --email=you@example.com \
  --password=YourStrongPassword123!
```

### 7. Domains

Assign public domains to **web** and **api**. Point `NEXT_PUBLIC_API_URL` and `CORS_ORIGIN` to the api domain.

## Local development

```bash
# 1. Copy env
cp .env.example .env
# edit DATABASE_URL, REDIS_URL, JWT_SECRET

# 2. Start Postgres + Redis (Docker)
docker compose up -d postgres redis

# 3. Install
npm install

# 4. DB
cd packages/database && npx prisma generate && npx prisma db push && npx tsx src/seed.ts && cd ../..

# 5. Run (3 terminals)
npm run start:api      # or: npx tsx apps/api/src/index.ts
npm run start:worker
npm run start:web      # or: cd apps/web && npm run dev
```

Open http://localhost:3000

## Quick test flow

1. Register → Login
2. **Minecraft Accounts** → create Offline account (username 3-16 chars)
3. **Servers** → add a server that allows offline mode (e.g. your own test server)
4. **Create Bot** → link account + server
5. Start bot → watch status + logs on bot detail page

## Security notes

- Private IPs blocked for server hosts (SSRF protection)
- Passwords hashed with Argon2id
- Tokens never returned to frontend for premium accounts
- Offline accounts clearly labelled
- No anti-cheat bypasses implemented

## Microsoft Premium (optional)

1. Azure Portal → App registrations → New
2. Redirect URI: `https://your-api.up.railway.app/api/auth/microsoft/callback`
3. Set `MICROSOFT_CLIENT_ID` + `MICROSOFT_CLIENT_SECRET`
4. Implement full OAuth code flow + encrypt tokens with `ENCRYPTION_KEY` before storing in `accessTokenEnc` / `refreshTokenEnc`

## License / Disclaimer

Use only on servers that allow automated clients. Offline mode does not prove ownership. Authors are not responsible for bans or ToS violations on third-party servers.
