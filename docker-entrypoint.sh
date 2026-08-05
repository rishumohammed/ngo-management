#!/bin/sh
set -e

echo "=================================================="
echo " Starting Free Mind Foundation Portal..."
echo "=================================================="

# 1. Sync database schema
if [ -n "$DATABASE_URL" ]; then
  echo "Applying database migrations (Prisma db push)..."
  npx prisma db push --accept-data-loss || echo "Prisma db push finished or skipped"

  echo "Seeding initial admin and settings if needed..."
  node prisma/seed.js || echo "Prisma seed finished or skipped"
fi

echo "=================================================="
echo " FMF Portal Server is ready!"
echo "=================================================="

exec "$@"
