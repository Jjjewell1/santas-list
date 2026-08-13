#!/bin/sh
set -e

# Prisma SQLite DB lives in a volume mounted at /app/data.
mkdir -p /app/data
chown -R nextjs:nextjs /app/data 2>/dev/null || true

# Run migrations and seed as a non-root user, then start the standalone server.
su-exec nextjs:nextjs sh -c '
  npx prisma migrate deploy
  node prisma/seed.mjs
  exec node server.js
'
