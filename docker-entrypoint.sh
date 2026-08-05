#!/bin/sh
set -e

echo "=================================================="
echo " Starting Free Mind Foundation Portal..."
echo "=================================================="

# 1. Sync database schema
if [ -n "$DATABASE_URL" ]; then
  echo "Applying database migrations (Prisma db push)..."
  npx prisma db push --skip-generate || echo "Warning: prisma db push encountered a non-fatal issue, continuing..."

  echo "Seeding initial admin and settings if needed..."
  node prisma/seed.js || echo "Warning: prisma seed encountered a non-fatal issue, continuing..."
fi

echo "=================================================="
echo " FMF Portal Server is ready!"
echo "=================================================="

exec "$@"
