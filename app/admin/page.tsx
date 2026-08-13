import Link from 'next/link';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getCurrentYear } from '@/lib/year';
import { computeStats, formatMoney, CATEGORY_META, type Category } from '@/lib/budget';
import { getBaseUrl } from '@/lib/constants';
import KidAvatar from '@/components/KidAvatar';
import ShareLinkBlock from '@/components/ShareLinkBlock';
import { regenerateFamilyShareToken, revokeFamilyShareToken } from '@/app/actions/admin-actions';

export default async function AdminDashboard() {
  const year = await getCurrentYear();
  if (!year) return <p className="text-ink-soft">No current year — set one up in the Archive.</p>;

  const kids = await prisma.kid.findMany({
    where: { yearId: year.id },
    include: { items: true },
    orderBy: { position: 'asc' },
  });

  const header = await headers();
  const base = getBaseUrl(header.get('x-forwarded-proto'), header.get('x-forwarded-host') ?? header.get('host'));
  const familyUrl = year.familyShareToken ? `${base}/share/family/${year.familyShareToken}` : null;

  const rows = kids.map((kid) => {
    const items = kid.items.map((i) => ({ id: i.id, category: i.category as Category, price: i.price }));
    const big = computeStats(kid, items, 'big');
    const small = computeStats(kid, items, 'small');
    const wild = computeStats(kid, items, 'wildcard');
    const total = big.total + small.total + wild.total;
    return { kid, big, small, wild, total };
  });

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const needSetup = kids.filter((k) => k.bigBudget === null && k.smallBudget === null).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-pine-900">Season {year.year}</h1>
        <p className="text-ink-soft">The family workshop, at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm font-display font-semibold uppercase tracking-wider text-ink-soft">Grand total</p>
          <p className="mt-1 font-display text-3xl font-bold text-cran-600">{formatMoney(grandTotal)}</p>
          <p className="text-xs text-ink-soft">across {kids.length} kid{ kids.length === 1 ? '' : 's'}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-display font-semibold uppercase tracking-wider text-ink-soft">Lists ready</p>
          <p className="mt-1 font-display text-3xl font-bold text-pine-700">
            {kids.length - needSetup}<span className="text-lg text-ink-soft">/{kids.length}</span>
          </p>
          <p className="text-xs text-ink-soft">{needSetup > 0 ? `${needSetup} still need budgets set` : 'all budgets set'}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-display font-semibold uppercase tracking-wider text-ink-soft">Share links</p>
          <p className="mt-1 font-display text-3xl font-bold text-gold-500">
            {kids.filter((k) => k.shareToken).length + (year.familyShareToken ? 1 : 0)}
          </p>
          <p className="text-xs text-ink-soft">{year.familyShareToken ? 'family link active' : 'no family link yet'}</p>
        </div>
      </div>

      <ShareLinkBlock
        url={familyUrl}
        label="Family share link (all kids)"
        regenerate={regenerateFamilyShareToken}
        revoke={revokeFamilyShareToken}
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-pine-900">Kids</h2>
          <Link href="/admin/kids" className="btn-ghost py-2 text-sm">
            Manage kids
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ kid, total }) => {
            const configured = kid.bigBudget == null || kid.smallBudget == null;
            return (
              <Link key={kid.id} href={`/admin/kids/${kid.id}`} className="card flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5 hover:shadow-lift">
                <KidAvatar avatar={kid.avatar} color={kid.color} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-pine-900">{kid.name}</p>
                  <p className="text-sm font-semibold text-cran-600">{formatMoney(total)}</p>
                  <p className="text-xs text-ink-soft">
                    {!configured ? '⚠️ no budgets yet' : kid.pinHash ? 'budgets set · PIN ready' : 'budgets set · no PIN'}
                  </p>
                </div>
                <span className="text-ink-soft">→</span>
              </Link>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-ink-soft">
        Pro tip: past seasons stay read-only in the <Link href="/admin/archive" className="underline">Archive</Link>.
      </p>
    </div>
  );
}
