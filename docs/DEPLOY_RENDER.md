# Render Deploy (Hindi + English)

## Problem: empty folders

Git does not upload empty folders (`tests/`, `docs/`, `scripts/`).
We added `.gitkeep` and sample files so they appear on GitHub.

## Quick steps

1. Push full repo to GitHub (including tests/, docs/, scripts/)
2. Render → PostgreSQL + Redis
3. Web Service = API (`npx tsx apps/api/src/index.ts`)
4. Background Worker = Mineflayer worker
5. Web Service = frontend (`apps/web`)
6. Set env: DATABASE_URL, REDIS_URL, JWT_SECRET, NEXT_PUBLIC_API_URL, CORS_ORIGIN

See root README.md for full guide.
