import { redirect } from 'next/navigation';
import { verifySession, type SessionPayload } from './session';

/** Throws a redirect to /login when the caller isn't the parent. */
export async function requireParent(): Promise<SessionPayload & { role: 'parent' }> {
  const session = await verifySession();
  if (!session || session.role !== 'parent') redirect('/login');
  return session;
}

/** Throws a redirect to the kid portal picker when there's no kid session. */
export async function requireKid(): Promise<SessionPayload & { role: 'kid' }> {
  const session = await verifySession();
  if (!session || session.role !== 'kid') redirect('/kid');
  return session;
}

/**
 * Resolves the caller as either the parent or the kid whose id is `kidId`.
 * Throws a redirect for anyone else.
 */
export async function requireKidOrParent(kidId: number): Promise<SessionPayload> {
  const session = await verifySession();
  if (!session) redirect('/kid');
  if (session.role === 'parent') return session;
  if (session.role === 'kid' && session.kidId === kidId) return session;
  redirect(`/kid/${session.role === 'kid' ? `${session.kidId}/list` : 'kid'}`);
}
