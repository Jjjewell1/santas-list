import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'xmas_session';

export type SessionPayload =
  | { role: 'parent' }
  | { role: 'kid'; kidId: number; yearId: number; name: string };

const ALG = 'HS256';

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    // Dev-only fallback so the app boots before .env setup. Never ship this.
    return new TextEncoder().encode('dev-only-secret-00000000000000000000');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(maxAgeSeconds)
    .sign(getSecret());
}

export async function verifySession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role === 'parent') return { role: 'parent' };
    if (payload.role === 'kid' && typeof payload.kidId === 'number') {
      return {
        role: 'kid',
        kidId: payload.kidId,
        yearId: Number(payload.yearId),
        name: String(payload.name ?? ''),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function setPendingAddCookie(url: string): Promise<void> {
  const store = await cookies();
  store.set('xmas_pending_add', url, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });
}

export async function getPendingAddCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get('xmas_pending_add')?.value ?? null;
}

export async function clearPendingAddCookie(): Promise<void> {
  const store = await cookies();
  store.delete('xmas_pending_add');
}
