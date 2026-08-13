import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CATEGORY_META, CATEGORIES, computeStats, formatMoney, type Category } from '@/lib/budget';
import KidAvatar from '@/components/KidAvatar';
import ProgressBar from '@/components/ProgressBar';

export default async function ArchiveYearPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const yearId = Number(id);
  if (!Number.isInteger(yearId)) notFound();

  const year = await prisma.year.findUnique({
    where: { id: yearId },
    include: { kids: { include: { items: { orderBy: { position: 'asc' } } }, orderBy: { position: 'asc' } } },
  });
  if (!year) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/archive" className="text-sm font-semibold text-pine-700 underline">
          ← Archive
        </Link>
        <h1 className="text-3xl font-bold text-pine-900">{year.year} season</h1>
        <span className="rounded-full bg-pine-100 px-3 py-1 text-xs font-semibold text-pine-800">
          {year.locked ? '🔒 archived' : 'read-only view'}
        </span>
      </div>

      {year.kids.length === 0 && (
        <p className="card p-8 text-center text-ink-soft">No kids on record for this season.</p>
      )}

      {year.kids.map((kid) => {
        const itemLike = kid.items.map((i) => ({ id: i.id, category: i.category as Category, price: i.price }));
        const stats = CATEGORIES.reduce(
          (acc, c) => {
            acc[c] = computeStats(kid, itemLike, c);
            return acc;
          },
          {} as Record<Category, ReturnType<typeof computeStats>>
        );
        const total = Object.values(stats).reduce((s, st) => s + st.total, 0);

        return (
          <div key={kid.id} className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pine-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <KidAvatar avatar={kid.avatar} color={kid.color} size="md" />
                <div>
                  <p className="font-display text-xl font-bold text-pine-900">{kid.name}</p>
                  <p className="text-xs text-ink-soft">
                    big {kid.bigBudget != null ? formatMoney(kid.bigBudget) : '—'} · small{' '}
                    {kid.smallBudget != null ? formatMoney(kid.smallBudget) : '—'} · wildcard{' '}
                    {kid.wildcardEnabled ? 'on' : 'off'}
                  </p>
                </div>
              </div>
              <span className="font-display text-lg font-bold text-cran-600">{formatMoney(total)}</span>
            </div>

            <div className="grid gap-4 px-5 py-4 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <div key={c} className="rounded-xl bg-snow p-3">
                  <p className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-pine-900">
                    <span>{CATEGORY_META[c].icon}</span> {CATEGORY_META[c].label}
                  </p>
                  <ProgressBar stats={stats[c]} />
                </div>
              ))}
            </div>

            <div className="border-t border-pine-100 px-5 py-4">
              {kid.items.length === 0 ? (
                <p className="text-sm text-ink-soft">Nothing on the list this year.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {kid.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 rounded-xl border border-pine-50 bg-snow p-3">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pine-50 text-lg">🎁</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-pine-900">{item.title}</p>
                        <p className="text-xs text-ink-soft">
                          {CATEGORY_META[item.category as Category].label}
                          {item.surpriseFlag && ' · 🙈 hidden'}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-cran-600">
                        {item.price != null ? formatMoney(item.price) : '—'}
                      </span>
                      {item.claimedBy && (
                        <span className="rounded-full bg-pine-100 px-2 py-0.5 text-xs font-semibold text-pine-800">
                          ✅ {item.claimedBy}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
