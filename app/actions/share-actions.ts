'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

/**
 * Public, no-login claim/unclaim used by relatives with a share link.
 * The token is only used to revalidate the correct page after mutation.
 */
export async function claimItem(itemId: number, claimer: string, token: string): Promise<{ ok: boolean; claimedBy: string | null }> {
  const name = claimer.trim().slice(0, 60);
  const item = await prisma.giftItem.findUnique({ where: { id: itemId }, include: { kid: true } });
  if (!item) return { ok: false, claimedBy: null };
  if (!name) return { ok: false, claimedBy: item.claimedBy };

  const claimedBy = name;
  await prisma.giftItem.update({ where: { id: itemId }, data: { claimedBy } });
  await logActivity(item.kid.name, 'Item claimed', `${item.title} by ${name}`);

  // Revalidate both possible share path shapes.
  revalidatePath(`/share/${token}`);
  revalidatePath(`/share/family/${token}`);
  return { ok: true, claimedBy };
}

export async function unclaimItem(itemId: number, token: string): Promise<{ ok: boolean }> {
  const item = await prisma.giftItem.findUnique({ where: { id: itemId }, include: { kid: true } });
  if (!item) return { ok: false };
  await prisma.giftItem.update({ where: { id: itemId }, data: { claimedBy: null } });
  await logActivity(item.kid.name, 'Item unclaimed', item.title);
  revalidatePath(`/share/${token}`);
  revalidatePath(`/share/family/${token}`);
  return { ok: true };
}
