'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireParent } from '@/lib/guard';
import { randomToken } from '@/lib/crypto';
import { parseDollarsToCents } from '@/lib/budget';
import { logActivity } from '@/lib/activity';
import { getCurrentYear } from '@/lib/year';

export interface ActionResult {
  ok: boolean;
  error?: string;
  token?: string;
  kidId?: number;
}

function kidPaths(id: number) {
  return [`/admin/kids/${id}`, '/admin', '/kid', `/kid/${id}/list`];
}

export async function addKid(formData: FormData): Promise<ActionResult> {
  await requireParent();
  const year = await getCurrentYear();
  if (!year) return { ok: false, error: 'No active year yet.' };

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { ok: false, error: 'Enter a name.' };
  const avatar = String(formData.get('avatar') ?? '🎄');
  const color = String(formData.get('color') ?? '#0f766e');

  const count = await prisma.kid.count({ where: { yearId: year.id } });
  const kid = await prisma.kid.create({
    data: { yearId: year.id, name, avatar, color, position: count },
  });
  await logActivity('Parent', 'Kid added', name);

  for (const p of ['/admin', '/admin/kids', '/kid']) revalidatePath(p);
  return { ok: true, kidId: kid.id };
}

export async function updateKid(kidId: number, name: string, avatar: string, color: string): Promise<ActionResult> {
  await requireParent();
  const clean = name.trim();
  if (!clean) return { ok: false, error: 'Enter a name.' };

  const kid = await prisma.kid.update({
    where: { id: kidId },
    data: { name: clean.slice(0, 40), avatar, color },
  });
  await logActivity('Parent', 'Kid updated', clean);
  for (const p of kidPaths(kidId)) revalidatePath(p);
  return { ok: true };
}

export async function deleteKid(kidId: number): Promise<ActionResult> {
  await requireParent();
  const kid = await prisma.kid.findUnique({ where: { id: kidId } });
  if (!kid) return { ok: false, error: 'Kid not found.' };

  await prisma.kid.delete({ where: { id: kidId } });
  await logActivity('Parent', 'Kid removed', kid.name);
  for (const p of ['/admin', '/admin/kids', '/kid']) revalidatePath(p);
  return { ok: true };
}

export async function setKidPin(kidId: number, pin: string): Promise<ActionResult> {
  await requireParent();
  const kid = await prisma.kid.findUnique({ where: { id: kidId } });
  if (!kid) return { ok: false, error: 'Kid not found.' };

  const clean = pin.trim();
  if (clean !== '' && !/^\d{4}$/.test(clean)) {
    return { ok: false, error: 'PIN must be exactly 4 digits (or leave blank to clear).' };
  }

  if (clean === '') {
    await prisma.kid.update({ where: { id: kidId }, data: { pinHash: null } });
    await logActivity('Parent', 'PIN cleared', kid.name);
  } else {
    const { hashSecret } = await import('@/lib/crypto');
    const pinHash = await hashSecret(clean);
    await prisma.kid.update({ where: { id: kidId }, data: { pinHash } });
    await logActivity('Parent', 'PIN set', `${kid.name} (${'•'.repeat(clean.length)})`);
  }
  for (const p of kidPaths(kidId)) revalidatePath(p);
  return { ok: true };
}

export async function saveKidSetup(
  kidId: number,
  bigBudgetInput: string,
  smallBudgetInput: string,
  softCeilingEnabled: boolean,
  softCeilingPct: number,
  wildcardEnabled: boolean
): Promise<ActionResult> {
  await requireParent();

  const big = bigBudgetInput.trim() === '' ? null : parseDollarsToCents(bigBudgetInput);
  const small = smallBudgetInput.trim() === '' ? null : parseDollarsToCents(smallBudgetInput);
  if (bigBudgetInput.trim() !== '' && big == null) return { ok: false, error: 'Big Gift budget isn\u2019t a valid amount.' };
  if (smallBudgetInput.trim() !== '' && small == null) return { ok: false, error: 'Small Gift budget isn\u2019t a valid amount.' };
  const pct = Math.min(99, Math.max(1, Math.round(softCeilingPct) || 60));

  const kid = await prisma.kid.findUnique({ where: { id: kidId } });
  if (!kid) return { ok: false, error: 'Kid not found.' };

  await prisma.kid.update({
    where: { id: kidId },
    data: {
      bigBudget: big,
      smallBudget: small,
      softCeilingEnabled,
      softCeilingPct: pct,
      wildcardEnabled,
    },
  });
  await logActivity(
    'Parent',
    'Budgets updated',
    `${kid.name}: big ${big ? (big / 100).toFixed(2) : 'blank'}, small ${small ? (small / 100).toFixed(2) : 'blank'}`
  );
  for (const p of kidPaths(kidId)) revalidatePath(p);
  return { ok: true };
}

export async function regenerateShareToken(kidId: number): Promise<ActionResult> {
  await requireParent();
  const token = randomToken(14);
  await prisma.kid.update({ where: { id: kidId }, data: { shareToken: token } });
  revalidatePath(`/admin/kids/${kidId}`);
  return { ok: true, token };
}

export async function revokeShareToken(kidId: number): Promise<ActionResult> {
  await requireParent();
  await prisma.kid.update({ where: { id: kidId }, data: { shareToken: null } });
  revalidatePath(`/admin/kids/${kidId}`);
  return { ok: true };
}

export async function regenerateFamilyShareToken(): Promise<ActionResult> {
  await requireParent();
  const year = await getCurrentYear();
  if (!year) return { ok: false, error: 'No active year.' };
  const token = randomToken(14);
  await prisma.year.update({ where: { id: year.id }, data: { familyShareToken: token } });
  revalidatePath('/admin/kids');
  return { ok: true, token };
}

export async function revokeFamilyShareToken(): Promise<ActionResult> {
  await requireParent();
  const year = await getCurrentYear();
  if (!year) return { ok: false, error: 'No active year.' };
  await prisma.year.update({ where: { id: year.id }, data: { familyShareToken: null } });
  revalidatePath('/admin/kids');
  return { ok: true };
}

export async function setLockDays(days: number): Promise<ActionResult> {
  await requireParent();
  const year = await getCurrentYear();
  if (!year) return { ok: false, error: 'No active year.' };
  const value = days > 0 ? Math.min(days, 25) : null;
  await prisma.year.update({ where: { id: year.id }, data: { lockDaysBefore: value } });
  revalidatePath('/admin/archive');
  return { ok: true };
}

export async function archiveCurrentYear(): Promise<ActionResult> {
  await requireParent();
  const year = await getCurrentYear();
  if (!year) return { ok: false, error: 'No active year.' };

  await prisma.year.update({ where: { id: year.id }, data: { isCurrent: false, locked: true } });

  const next = year.year + 1;
  const exists = await prisma.year.findUnique({ where: { year: next } });
  if (!exists) {
    await prisma.year.create({ data: { year: next, isCurrent: true } });
    await logActivity('Parent', 'Year archived', `${year.year} locked; started ${next}`);
  } else {
    await prisma.year.update({ where: { id: exists.id }, data: { isCurrent: true } });
    await logActivity('Parent', 'Year archived', `${year.year} locked; ${next} is now current`);
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function prepareNextYear(copyKids: boolean): Promise<ActionResult> {
  await requireParent();
  const current = await getCurrentYear();
  if (!current) return { ok: false, error: 'No active year.' };
  const next = current.year + 1;
  let target = await prisma.year.findUnique({ where: { year: next } });
  if (!target) {
    target = await prisma.year.create({ data: { year: next, isCurrent: false } });
  }

  if (copyKids) {
    const kids = await prisma.kid.findMany({ where: { yearId: current.id }, orderBy: { position: 'asc' } });
    if (kids.length > 0) {
      await prisma.kid.createMany({
        data: kids.map((k, i) => ({
          yearId: target!.id,
          name: k.name,
          avatar: k.avatar,
          color: k.color,
          position: i,
          bigBudget: k.bigBudget,
          smallBudget: k.smallBudget,
          wildcardEnabled: k.wildcardEnabled,
          softCeilingEnabled: k.softCeilingEnabled,
          softCeilingPct: k.softCeilingPct,
        })),
      });
      await logActivity('Parent', 'Kids copied', `${kids.length} profiles copied to ${next}`);
    }
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function saveTradition(
  day: number,
  title: string,
  description: string,
  photoUrl: string
): Promise<ActionResult> {
  await requireParent();
  const year = await getCurrentYear();
  if (!year) return { ok: false, error: 'No active year.' };

  await prisma.tradition.upsert({
    where: { yearId_day: { yearId: year.id, day } },
    create: {
      yearId: year.id,
      day,
      title: title.trim().slice(0, 80) || `Day ${day}`,
      description: description.trim().slice(0, 500),
      photoUrl: photoUrl.trim() || null,
    },
    update: {
      title: title.trim().slice(0, 80) || `Day ${day}`,
      description: description.trim().slice(0, 500),
      photoUrl: photoUrl.trim() || null,
    },
  });
  revalidatePath('/admin/traditions');
  revalidatePath('/');
  return { ok: true };
}

export async function deleteTradition(day: number): Promise<ActionResult> {
  await requireParent();
  const year = await getCurrentYear();
  if (!year) return { ok: false, error: 'No active year.' };
  await prisma.tradition.deleteMany({ where: { yearId: year.id, day } });
  revalidatePath('/admin/traditions');
  revalidatePath('/');
  return { ok: true };
}
