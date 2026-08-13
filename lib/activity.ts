import { prisma } from './prisma';

/** Records an entry in the parent-only activity log. Never throws. */
export async function logActivity(actor: string, action: string, detail?: string): Promise<void> {
  try {
    await prisma.activity.create({ data: { actor, action, detail: detail ?? null } });
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}
