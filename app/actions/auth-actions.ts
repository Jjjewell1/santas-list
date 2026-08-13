'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { hashSecret, verifySecret } from '@/lib/crypto';
import { createSessionToken, setSessionCookie, clearSessionCookie } from '@/lib/session';
import { logActivity } from '@/lib/activity';

export interface ActionResult {
  ok?: boolean;
  error?: string;
}

/** First-run bootstrap: creates the parent account (only when none exists). */
export async function setupAdmin(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const existing = await prisma.admin.count();
  if (existing > 0) return { ok: false, error: 'An admin account already exists.' };
  const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const isUsername = /^[a-z0-9_.-]{3,}$/i.test(email);
  if (!isEmail && !isUsername) return { ok: false, error: 'Enter a valid email or username.' };
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };

  const passwordHash = await hashSecret(password);
  await prisma.admin.create({ data: { email, passwordHash } });
  await logActivity('System', 'Admin account created', email);

  const token = await createSessionToken({ role: 'parent' }, 60 * 60 * 24 * 60);
  await setSessionCookie(token);
  redirect('/admin');
}

export async function parentLogin(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !(await verifySecret(password, admin.passwordHash))) {
    return { ok: false, error: 'Wrong email or password.' };
  }

  const token = await createSessionToken({ role: 'parent' }, 60 * 60 * 24 * 60);
  await setSessionCookie(token);
  logActivity('Parent', 'Signed in');
  redirect('/admin');
}

/** Kid login: matches a 4-digit PIN against their profile. */
export async function kidLogin(kidId: number, pin: string): Promise<ActionResult> {
  const kid = await prisma.kid.findUnique({ where: { id: kidId } });
  if (!kid) return { ok: false, error: 'That profile doesn\u2019t exist.' };
  if (!kid.pinHash) return { ok: false, error: 'This profile has no PIN yet — ask a parent to set one up.' };

  const ok = await verifySecret(pin, kid.pinHash);
  if (!ok) return { ok: false, error: 'That PIN doesn\u2019t match. Try again!' };

  const token = await createSessionToken(
    { role: 'kid', kidId: kid.id, yearId: kid.yearId, name: kid.name },
    60 * 60 * 24 * 30
  );
  await setSessionCookie(token);
  logActivity(kid.name, 'Signed in');
  redirect(`/kid/${kid.id}/list`);
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect('/');
}
