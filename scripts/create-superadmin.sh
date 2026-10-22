#!/bin/sh
# Usage: SUPERADMIN_BOOTSTRAP_SECRET=xxx ./scripts/create-superadmin.sh email@x.com Password123!
set -e
EMAIL="$1"
PASS="$2"
if [ -z "$EMAIL" ] || [ -z "$PASS" ]; then
  echo "Usage: $0 email password"
  exit 1
fi
npx tsx apps/api/src/scripts/create-superadmin.ts --email="$EMAIL" --password="$PASS"
