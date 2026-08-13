import Link from 'next/link';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getCurrentYear } from '@/lib/year';
import { computeStats, formatMoney, type Category } from '@/lib/budget';
import { getBaseUrl } from '@/lib/constants';
import KidAvatar from '@/components/KidAvatar';
import AddKidForm from '@/components/AddKidForm';
import ShareLinkBlock from '@/components/ShareLinkBlock';
import { regenerateFamilyShareToken, revokeFamilyShareToken } from '@/app/actions/admin-actions';

export default async function KidsAdminPage() {
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-pine-900">Kids &amp; Sharing</h1>
        <p className="text-ink-soft">Add kids, check their setup status, and hand out share links.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="card overflow-x-auto p-2 sm:p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-pine-100 text-xs font-display uppercase tracking-wider text-ink-soft">
                <th className="px-4 py-3">Kid</th>
                <th className="px-4 py-3">Budgets</th>
                <th className="px-4 py-3">PIN</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Share</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {kids.map((kid) => {
                const items = kid.items.map((i) => ({ id: i.id, category: i.category as Category, price: i.price }));
                const total =
                  computeStats(kid, items, 'big').total +
                  computeStats(kid, items, 'small').total +
                  computeStats(kid, items, 'wildcard').total;
                const configured = kid.bigBudget == null || kid.smallBudget == null;
                const shareUrl = kid.shareToken ? `${base}/share/${kid.shareToken}` : null;
                return (
                  <tr key={kid.id} className="border-b border-pine-50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <KidAvatar avatar={kid.avatar} color={kid.color} size="sm" />
                        <span className="font-display font-bold text-pine-900">{kid.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          configured ? 'bg-pine-100 text-pine-800' : 'bg-gold-100 text-gold-500'
                        }`}
                      >
                        {configured ? 'set' : 'not set'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          kid.pinHash ? 'bg-pine-100 text-pine-800' : 'bg-cran-100 text-cran-600'
                        }`}
                      >
                        {kid.pinHash ? 'ready' : 'none'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{kid.items.length}</td>
                    <td className="px-4 py-3 font-semibold text-cran-600">{formatMoney(total)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          shareUrl ? 'bg-pine-100 text-pine-800' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {shareUrl ? 'active' : 'none'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/kids/${kid.id}`} className="btn-ghost px-3 py-1.5 text-xs">
                        Setup →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {kids.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink-soft">
                    No kids yet — add one on the right.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-6">
          <AddKidForm />
          <ShareLinkBlock
            url={familyUrl}
            label="Family share link (all kids)"
            regenerate={regenerateFamilyShareToken}
            revoke={revokeFamilyShareToken}
          />
        </div>
      </div>
    </div>
  );
}
