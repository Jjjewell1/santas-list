import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Must match lib/crypto.ts exactly so existing hashes verify and new ones login.
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

function hashSecret(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString('hex')}$${derived.toString('base64')}`;
}

async function main() {
  const username = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const pin = (process.env.ADMIN_PIN || '').trim();
  if (!username || !password) {
    console.log('set-admin: ADMIN_USERNAME/ADMIN_PASSWORD not set — skipping.');
    return;
  }

  // The app treats Admin as a single parent account, so replace existing rows
  // with the configured credentials on every start.
  await prisma.admin.deleteMany({});
  await prisma.admin.create({
    data: {
      email: username,
      passwordHash: hashSecret(password),
      pinHash: pin ? hashSecret(pin) : null,
    },
  });
  console.log(`set-admin: parent account set to '${username}'${pin ? ` with PIN ${'•'.repeat(pin.length)}` : ''}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
