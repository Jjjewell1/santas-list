import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentYear } from '@/lib/year';
import { computeStats, formatMoney, type Category } from '@/lib/budget';
import ArchiveActions from '@/components/ArchiveActions';

export default async function ArchivePage() {
  const current = await getCurrentYear();
  const years = await prisma.year.findMany({
    include: { kids: { include: { items: true } } },
    orderBy: { year: 'desc' },
  });

  const totals = years.map((y) => {
    const itemLike = y.kids.flatMap((k) => k.items.map((i) => ({ id: i.id, category: i.category as Category, price: i.price })));
    const total = itemLike.reduce((s, i) => s + (i.price ?? 0), 0);
    return { year: y, total };
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-pine-900">Archive</h1>
        <p className="text-ink-soft">Every season stays here, frozen and read-only. Memories included.</p>
      </div>

      <ArchiveActions lockDays={current?.lockDaysBefore ?? null} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {totals.map(({ year, total }) => {
          const isCurrent = current?.id === year.id;
          return (
            <div key={year.id} className="card flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-bold text-pine-900">{year.year}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isCurrent ? 'bg-gold-100 text-gold-500' : year.locked ? 'bg-pine-100 text-pine-800' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {isCurrent ? '★ current' : year.locked ? '🔒 archived' : 'ready'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">{year.kids.length} kids</span>
                <span className="font-display font-semibold text-cran-600">{formatMoney(total)}</span>
              </div>
              <Link href={`/admin/archive/${year.id}`} className="btn-ghost py-2 text-sm">
                {isCurrent ? 'View this season →' : 'Browse archive →'}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
