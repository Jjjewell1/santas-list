import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import KidAvatar from '@/components/KidAvatar';
import KidListApp from '@/components/KidListApp';
import { prisma } from '@/lib/prisma';
import { requireKid } from '@/lib/guard';
import { isYearLocked } from '@/lib/year';
import { getPendingAddCookie } from '@/lib/session';
import { logout } from '@/app/actions/auth-actions';
import type { Category } from '@/lib/budget';

export default async function KidListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kidId = Number(id);
  if (!Number.isInteger(kidId)) notFound();

  const session = await requireKid();
  if (session.kidId == kidId) redirect(`/kid/${session.kidId}/list`);

  const kid = await prisma.kid.findUnique({
    where: { id: kidId },
    include: { items: { orderBy: { position: 'asc' } }, year: true },
  });
  if (!kid) notFound();

  const lock = isYearLocked(kid.year);
  const initialUrl = await getPendingAddCookie();

  const config = {
    bigBudget: kid.bigBudget,
    smallBudget: kid.smallBudget,
    wildcardEnabled: kid.wildcardEnabled,
    softCeilingEnabled: kid.softCeilingEnabled,
    softCeilingPct: kid.softCeilingPct,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-pine-50 via-snow to-snow">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 pt-6">
        <div className="flex items-center gap-3">
          <KidAvatar avatar={kid.avatar} color={kid.color} size="md" />
          <div>
            <p className="text-xs font-display font-semibold uppercase tracking-widest text-ink-soft">
              {kid.year.year} · {kid.name}&rsquo;s list
            </p>
            <h1 className="font-display text-xl font-bold text-pine-900">Merry Christmas, {kid.name}! 🎄</h1>
          </div>
        </div>
        <form action={logout}>
          <button type="submit" className="btn-ghost px-3 py-2 text-sm">
            Sign out
          </button>
        </form>
      </header>

      <KidListApp
        kidId={kid.id}
        name={kid.name}
        items={kid.items.map((i) => ({
          id: i.id,
          title: i.title,
          imageUrl: i.imageUrl,
          price: i.price,
          productUrl: i.productUrl,
          category: i.category as Category,
          surpriseFlag: i.surpriseFlag,
          position: i.position,
        }))}
        config={config}
        locked={lock.locked}
        initialUrl={initialUrl}
      />

      <footer className="pb-10 text-center">
        <Link href="/" className="text-sm font-semibold text-pine-700 underline">
          Back to the front yard
        </Link>
      </footer>
    </main>
  );
}
