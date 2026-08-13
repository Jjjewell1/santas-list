import { randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(_scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number }
) => Promise<Buffer>;

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

/**
 * Hashes a password (or 4-digit PIN) with scrypt.
 * Format: scrypt$N$r$p$saltHex$hashBase64
 */
export async function hashSecret(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString('hex')}$${derived.toString('base64')}`;
}

/** Verifies a password/PIN against a stored scrypt hash. */
export async function verifySecret(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, n, r, p, saltHex, hashB64] = stored.split('$');
    if (scheme !== 'scrypt') return false;
    const derived = await scrypt(password, Buffer.from(saltHex, 'hex'), KEYLEN, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    const expected = Buffer.from(hashB64, 'base64');
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Random URL-safe token used for share links. */
export function randomToken(bytes = 18): string {
  return randomBytes(bytes).toString('base64url');
}
