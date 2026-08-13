'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireKidOrParent, requireParent } from '@/lib/guard';
import { checkAdd, type AddCheck, type Category } from '@/lib/budget';
import { isYearLocked } from '@/lib/year';
import { logActivity } from '@/lib/activity';

export type AddItemResult = AddCheck & { id?: number };

function pathsFor(kidId: number) {
  return [`/kid/${kidId}/list`, `/admin/kids/${kidId}`, '/admin'];
}

async function kidOrThrow(kidId: number) {
  const kid = await prisma.kid.findUnique({ where: { id: kidId }, include: { year: true, items: true } });
  if (!kid) throw new Error('Kid not found');
  return kid;
}

export async function addItem(
  kidId: number,
  category: Category,
  title: string,
  priceCents: number | null,
  imageUrl: string | null,
  productUrl: string | null
): Promise<AddItemResult> {
  await requireKidOrParent(kidId);
  const kid = await kidOrThrow(kidId);
  if (isYearLocked(kid.year).locked) {
    return { ok: false, reason: 'disabled' };
  }
  const cleanTitle = title.trim();
  if (!cleanTitle) return { ok: false, reason: 'disabled' };

  const check = checkAdd(kid, kid.items, category, priceCents);
  if (!check.ok) return check;

  const maxPos = kid.items.reduce((m, i) => Math.max(m, i.position), -1);
  const item = await prisma.giftItem.create({
    data: {
      kidId,
      category,
      title: cleanTitle.slice(0, 200),
      price: priceCents,
      imageUrl: imageUrl?.slice(0, 2000) || null,
      productUrl: productUrl?.slice(0, 2000) || null,
      position: maxPos + 1,
    },
  });
  await logActivity(kid.name, 'Item added', `${cleanTitle} (${category})`);
  for (const p of pathsFor(kidId)) revalidatePath(p);
  return { ok: true, id: item.id };
}

export async function deleteItem(itemId: number): Promise<{ ok: boolean }> {
  const item = await prisma.giftItem.findUnique({ where: { id: itemId }, include: { kid: true } });
  if (!item) return { ok: false };
  await requireKidOrParent(item.kidId);
  const kid = await kidOrThrow(item.kidId);
  if (isYearLocked(kid.year).locked) return { ok: false };

  await prisma.giftItem.delete({ where: { id: itemId } });
  await logActivity(item.kid.name, 'Item removed', item.title);
  for (const p of pathsFor(item.kidId)) revalidatePath(p);
  return { ok: true };
}

export async function moveItem(
  itemId: number,
  targetCategory: Category,
  targetPosition: number
): Promise<{ ok: boolean; error?: string }> {
  const item = await prisma.giftItem.findUnique({ where: { id: itemId }, include: { kid: { include: { items: true, year: true } } } });
  if (!item) return { ok: false, error: 'Item not found.' };
  await requireKidOrParent(item.kidId);
  if (isYearLocked(item.kid.year).locked) return { ok: false, error: 'locked' };

  if (item.category === targetCategory) {
    // Pure reorder within the same category.
    const siblings = item.kid.items
      .filter((i) => i.category === targetCategory && i.id !== itemId)
      .sort((a, b) => a.position - b.position);
    const clamped = Math.max(0, Math.min(targetPosition, siblings.length));
    const ordered = [...siblings.slice(0, clamped), item, ...siblings.slice(clamped)];
    await prisma.$transaction(
      ordered.map((i, idx) => prisma.giftItem.update({ where: { id: i.id }, data: { position: idx } }))
    );
    for (const p of pathsFor(item.kidId)) revalidatePath(p);
    return { ok: true };
  }

  // Moving into another category: re-validate its limits, excluding this item.
  const check = checkAdd(
    item.kid,
    item.kid.items.filter((i) => i.id !== itemId),
    targetCategory,
    item.price
  );
  if (!check.ok) {
    return {
      ok: false,
      error: check.reason === 'max-items' ? 'That section is full.' : 'That would put the section over budget.',
    };
  }

  const targetSiblings = item.kid.items
    .filter((i) => i.category === targetCategory && i.id !== itemId)
    .sort((a, b) => a.position - b.position);
  const clamped = Math.max(0, Math.min(targetPosition, targetSiblings.length));
  const ordered = [...targetSiblings.slice(0, clamped), item, ...targetSiblings.slice(clamped)];

  await prisma.$transaction([
    prisma.giftItem.update({ where: { id: itemId }, data: { category: targetCategory, position: 0 } }),
    ...ordered.map((i, idx) =>
      prisma.giftItem.update({ where: { id: i.id }, data: { position: idx } })
    ),
  ]);
  await logActivity(item.kid.name, 'Item moved', `${item.title} → ${targetCategory}`);
  for (const p of pathsFor(item.kidId)) revalidatePath(p);
  return { ok: true };
}

/** Reorders all items in a category to match the given id order. */
export async function reorderItems(category: Category, orderedIds: number[]): Promise<{ ok: boolean }> {
  const items = await prisma.giftItem.findMany({ where: { id: { in: orderedIds } }, include: { kid: true } });
  if (items.length !== orderedIds.length) return { ok: false };
  const kidId = items[0].kidId;
  if (items.some((i) => i.kidId !== kidId)) return { ok: false };
  await requireKidOrParent(kidId);
  const kid = await kidOrThrow(kidId);
  if (isYearLocked(kid.year).locked) return { ok: false };

  const byId = new Map(items.map((i) => [i.id, i]));
  if (orderedIds.some((id) => byId.get(id)?.category !== category)) return { ok: false };

  await prisma.$transaction(
    orderedIds.map((id, idx) => prisma.giftItem.update({ where: { id }, data: { position: idx } }))
  );
  for (const p of pathsFor(kidId)) revalidatePath(p);
  return { ok: true };
}

/** Kid-only: hides/shows an item on the shared/claim view. */
export async function toggleSurprise(itemId: number): Promise<{ ok: boolean }> {
  const item = await prisma.giftItem.findUnique({ where: { id: itemId }, include: { kid: { include: { year: true } } } });
  if (!item) return { ok: false };
  await requireKidOrParent(item.kidId);
  if (isYearLocked(item.kid.year).locked) return { ok: false };

  await prisma.giftItem.update({ where: { id: itemId }, data: { surpriseFlag: !item.surpriseFlag } });
  for (const p of pathsFor(item.kidId)) revalidatePath(p);
  return { ok: true };
}

/** Admin: delete any item. */
export async function deleteItemAdmin(itemId: number): Promise<{ ok: boolean }> {
  await requireParent();
  const item = await prisma.giftItem.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false };
  await prisma.giftItem.delete({ where: { id: itemId } });
  await logActivity('Parent', 'Item removed', item.title);
  for (const p of pathsFor(item.kidId)) revalidatePath(p);
  return { ok: true };
}
