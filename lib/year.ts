import { prisma } from './prisma';
import type { Year } from '@prisma/client';

export async function getCurrentYear(): Promise<Year | null> {
  return prisma.year.findFirst({ where: { isCurrent: true } });
}

export interface LockInfo {
  locked: boolean;
  reason: 'archived' | 'auto' | null;
}

/** Derived auto-lock: lists freeze `lockDaysBefore` days before Dec 25. */
export function isYearLocked(year: Pick<Year, 'locked' | 'lockDaysBefore'>, now: Date = new Date()): LockInfo {
  if (year.locked) return { locked: true, reason: 'archived' };
  if (year.lockDaysBefore && year.lockDaysBefore > 0) {
    const lockDate = new Date(now.getFullYear(), 11, 25 - year.lockDaysBefore);
    if (now >= lockDate) return { locked: true, reason: 'auto' };
  }
  return { locked: false, reason: null };
}
