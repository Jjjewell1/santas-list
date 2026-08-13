import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isYearLocked } from '@/lib/year';
import { CATEGORY_META, CATEGORIES, computeStats, formatMoney, type Category } from '@/lib/budget';
import { getBaseUrl } from '@/lib/constants';
import KidAvatar from '@/components/KidAvatar';
import KidSetupForm from '@/components/KidSetupForm';
import PinManager from '@/components/PinManager';
import ShareLinkBlock from '@/components/ShareLinkBlock';
import ProgressBar from '@/components/ProgressBar';
import DeleteKidButton from '@/components/DeleteKidButton';
import { regenerateShareToken, revokeShareToken } from '@/app/actions/admin-actions';
import { deleteItemAdmin } from '@/app/actions/item-actions';

export default async function KidAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kidId = Number(id);
  if (!Number.isInteger(kidId)) notFound();

  const kid = await prisma.kid.findUnique({
    where: { id: kidId },
    include: { items: { orderBy: { position: 'asc' } }, year: true },
  });
  if (!kid) notFound();

  const locked = isYearLocked(kid.year).locked;

  const header = await headers();
  const base = getBaseUrl(header.get('x-forwarded-proto'), header.get('x-forwarded-host') ?? header.get('host'));
  const shareUrl = kid.shareToken ? `${base}/share/${kid.shareToken}` : null;

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
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/kids" className="text-sm font-semibold text-pine-700 underline">
            ← All kids
          </Link>
          <KidAvatar avatar={kid.avatar} color={kid.color} size="md" />
          <div>
            <h1 className="text-2xl font-bold text-pine-900">{kid.name}</h1>
            <p className="text-xs text-ink-soft">
              {kid.year.year} season {locked ? '· 🔒 locked' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-pine-100 px-4 py-2 font-display text-lg font-bold text-pine-900">
            {formatMoney(total)} total
          </span>
          {!locked && <DeleteKidButton kidId={kid.id} kidName={kid.name} />}
        </div>
      </div>

      {/* Live cost calculator */}
      <div className="card p-5">
        <h3 className="mb-4 font-display text-lg font-bold text-pine-900">Live cost calculator</h3>
        <div className="grid gap-5 sm:grid-cols-3">
          {CATEGORIES.map((c) => {
            const st = stats[c];
            const meta = CATEGORY_META[c];
            return (
              <div key={c} className="rounded-xl bg-snow p-3">
                <p className="mb-2 flex items-center gap-2 font-display font-semibold text-pine-900">
                  <span>{meta.icon}</span> {meta.label}
                </p>
                <ProgressBar stats={st} />
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-sm font-semibold text-ink-soft">
          Grand total: <span className="font-display text-lg text-cran-600">{formatMoney(total)}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <KidSetupForm
          kidId={kid.id}
          bigBudget={kid.bigBudget}
          smallBudget={kid.smallBudget}
          softCeilingEnabled={kid.softCeilingEnabled}
          softCeilingPct={kid.softCeilingPct}
          wildcardEnabled={kid.wildcardEnabled}
          locked={locked}
        />
        <div className="flex flex-col gap-6">
          <PinManager kidId={kid.id} hasPin={kid.pinHash == null} kidName={kid.name} />
          <ShareLinkBlock
            url={shareUrl}
            label="Shareable list link"
            regenerate={regenerateShareToken.bind(null, kid.id)}
            revoke={revokeShareToken.bind(null, kid.id)}
          />
        </div>
      </div>

      {/* Items */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-pine-100 px-5 py-4">
          <h3 className="font-display text-lg font-bold text-pine-900">Wishlist items</h3>
          <span className="text-xs font-semibold text-ink-soft">{kid.items.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-pine-100 text-xs font-display uppercase tracking-wider text-ink-soft">
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">Section</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Claimed</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {kid.items.map((item) => (
                <tr key={item.id} className="border-b border-pine-50 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pine-50 text-lg">🎁</span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-pine-900">{item.title}</p>
                        <p className="truncate text-xs text-ink-soft">
                          {item.surpriseFlag && '🙈 hidden · '}
                          {item.productUrl ? item.productUrl.replace(/^https?:\/\//, '') : 'no link'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-pine-50 px-2 py-0.5 text-xs font-semibold text-pine-800">
                      {CATEGORY_META[item.category as Category].label}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-cran-600">{item.price != null ? formatMoney(item.price) : '—'}</td>
                  <td className="px-5 py-3">
                    {item.claimedBy ? (
                      <span className="rounded-full bg-pine-100 px-2 py-0.5 text-xs font-semibold text-pine-800">
                        ✅ {item.claimedBy}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-soft">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <form
                      action={async () => {
                        'use server';
                        await deleteItemAdmin(item.id);
                      }}
                    >
                      <button type="submit" className="btn-ghost px-3 py-1 text-xs text-cran-600">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {kid.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink-soft">
                    Nothing on the list yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {shareUrl && (
          <div className="border-t border-pine-100 px-5 py-3 text-sm">
            <a href={`${shareUrl}`} target="_blank" rel="noreferrer" className="font-semibold text-pine-700 underline">
              Open share view
            </a>{' '}
            <span className="text-ink-soft">— relatives can claim items and print the list there.</span>
          </div>
        )}
      </div>
    </div>
  );
}
