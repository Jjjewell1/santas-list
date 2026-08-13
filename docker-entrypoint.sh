#!/bin/sh
set -e

# The app runs as UID/GID 1001 (non-root). The Prisma SQLite DB lives in a
# volume mounted at /app/data — make sure it (and a HOME for the Prisma CLI)
# are writable by that user, regardless of who owns the mount.
mkdir -p /app/data /home/nextjs
chown -R 1001:1001 /app/data /home/nextjs 2>/dev/null || true

export HOME=/home/nextjs

# Run migrations and seed as a non-root user, then start the standalone server.
su-exec 1001:1001 sh -c '
  npx prisma migrate deploy
  node prisma/seed.mjs
  node scripts/set-admin.mjs
  exec node server.js
'
