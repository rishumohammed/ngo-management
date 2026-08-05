#!/bin/sh
set -e

echo "=================================================="
echo " Starting Free Mind Foundation Portal..."
echo "=================================================="

# 1. Ensure Prisma Client is generated and up-to-date
echo "Generating Prisma Client..."
npx prisma generate || echo "Warning: prisma generate fallback"

# 2. Sync database schema
if [ -n "$DATABASE_URL" ]; then
  echo "Applying database schema (Prisma db push)..."
  npx prisma db push --accept-data-loss || echo "Warning: prisma db push fallback"

  echo "Seeding initial admin and settings if needed..."
  node prisma/seed.js || echo "Warning: prisma seed fallback"
fi

echo "=================================================="
echo " FMF Portal Server is ready!"
echo "=================================================="

exec "$@"
