import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { CATEGORIES, CATEGORY_META, formatMoney, type Category } from '@/lib/budget';
import KidAvatar from '@/components/KidAvatar';
import ClaimControls from '@/components/ClaimControls';

export default async function FamilySharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const year = await prisma.year.findUnique({
    where: { familyShareToken: token },
    include: { kids: { include: { items: { orderBy: { position: 'asc' } } }, orderBy: { position: 'asc' } } },
  });
  if (!year) notFound();

  const kids = year.kids.filter((k) => k.items.some((i) => i.surpriseFlag));

  return (
    <main className="min-h-screen bg-snow print:bg-white">
      <header className="no-print bg-gradient-to-b from-pine-900 to-pine-700 py-8 text-center text-white">
        <h1 className="font-display text-3xl font-bold">The Family Christmas List</h1>
        <p className="mt-1 text-sm text-gold-200">{year.year} · tap &ldquo;I&rsquo;ve got this&rdquo; to claim a gift</p>
        <div className="mt-4 flex justify-center gap-2">
          <button type="button" onClick={() => window.print()} className="btn-gold py-2 text-sm">
            🖨️ Print all lists
          </button>
          <Link href="/" className="btn-ghost py-2 text-sm">
            Home
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-8 print:max-w-none print:p-0">
        {kids.length === 0 ? (
          <p className="card p-8 text-center text-ink-soft">Nothing on anyone&rsquo;s list yet — check back soon! 🎄</p>
        ) : (
          kids.map((kid) => {
            const visible = kid.items.filter((i) => i.surpriseFlag);
            return (
              <section key={kid.id}>
                <div className="mb-3 flex items-center gap-3">
                  <KidAvatar avatar={kid.avatar} color={kid.color} size="sm" />
                  <h2 className="font-display text-2xl font-bold text-pine-900">{kid.name}</h2>
                </div>
                <div className="flex flex-col gap-8">
                  {CATEGORIES.map((c) => {
                    const catItems = visible.filter((i) => i.category === c);
                    if (catItems.length === 0) return null;
                    return (
                      <div key={c}>
                        <h3 className="mb-2 font-display text-lg font-bold text-pine-800">
                          {CATEGORY_META[c].icon} {CATEGORY_META[c].label}
                        </h3>
                        <div className="flex flex-col gap-2">
                          {catItems.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-start gap-3 rounded-2xl border bg-white p-3 shadow-card ${
                                item.claimedBy ? 'border-pine-300' : 'border-pine-100'
                              }`}
                            >
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.imageUrl}
                                  alt=""
                                  className="h-14 w-14 shrink-0 rounded-xl object-cover print:h-10 print:w-10"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-pine-50 text-2xl">🎁</span>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-display font-bold text-pine-900">
                                  {item.claimedBy && <span className="mr-1.5">✅</span>}
                                  {item.title}
                                </p>
                                <p className="text-sm font-semibold text-cran-600">
                                  {item.price != null ? formatMoney(item.price) : 'Price not set'}
                                </p>
                                {item.claimedBy ? (
                                  <p className="mt-0.5 text-xs font-semibold text-pine-800">Claimed by {item.claimedBy} 🎉</p>
                                ) : (
                                  <p className="mt-0.5 text-xs text-ink-soft">Still up for grabs!</p>
                                )}
                              </div>
                              <ClaimControls itemId={item.id} itemTitle={item.title} token={token} claimedBy={item.claimedBy} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>

      <footer className="no-print py-8 text-center text-xs text-ink-soft">
        A little elf-made app for the {year.year} season. 🎄
      </footer>
    </main>
  );
}
