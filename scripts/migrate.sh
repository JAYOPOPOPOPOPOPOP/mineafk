#!/bin/sh
# Run DB migrate + seed (on Render API shell or locally)
set -e
cd packages/database
npx prisma generate
npx prisma db push
npx tsx src/seed.ts
echo "Done."
