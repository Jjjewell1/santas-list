import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { CATEGORIES, CATEGORY_META, formatMoney, type Category } from '@/lib/budget';
import ClaimControls from '@/components/ClaimControls';

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const kid = await prisma.kid.findUnique({
    where: { shareToken: token },
    include: { items: { orderBy: { position: 'asc' } }, year: true },
  });
  if (!kid) notFound();

  const visible = kid.items.filter((i) => i.surpriseFlag);

  return (
    <main className="min-h-screen bg-snow print:bg-white">
      <header className="no-print bg-gradient-to-b from-pine-900 to-pine-700 py-8 text-center text-white">
        <h1 className="font-display text-3xl font-bold">{kid.name}&rsquo;s Christmas List</h1>
        <p className="mt-1 text-sm text-gold-200">{kid.year.year} · tap &ldquo;I&rsquo;ve got this&rdquo; to claim a gift</p>
        <div className="mt-4 flex justify-center gap-2">
          <button type="button" onClick={() => window.print()} className="btn-gold py-2 text-sm">
            🖨️ Print list
          </button>
          <Link href="/" className="btn-ghost py-2 text-sm">
            Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 print:max-w-none print:p-0">
        {visible.length === 0 ? (
          <p className="card p-8 text-center text-ink-soft">Nothing here yet — check back soon! 🎄</p>
        ) : (
          <div className="flex flex-col gap-8">
            {CATEGORIES.map((c) => {
              const catItems = visible.filter((i) => i.category === c);
              if (catItems.length === 0) return null;
              return (
                <section key={c}>
                  <h2 className="mb-3 font-display text-xl font-bold text-pine-900">
                    {CATEGORY_META[c].icon} {CATEGORY_META[c].label}
                    <span className="ml-2 text-sm font-semibold text-ink-soft">
                      {catItems.length}/{CATEGORY_META[c].maxItems}
                    </span>
                  </h2>
                  <div className="flex flex-col gap-3">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-card ${
                          item.claimedBy ? 'border-pine-300' : 'border-pine-100'
                        }`}
                      >
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-xl object-cover print:h-12 print:w-12"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-pine-50 text-3xl">
                            🎁
                          </span>
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
                            <p className="mt-0.5 text-xs font-semibold text-pine-800">
                              Claimed by {item.claimedBy} 🎉
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs text-ink-soft">Still up for grabs!</p>
                          )}
                        </div>
                        <ClaimControls itemId={item.id} itemTitle={item.title} token={token} claimedBy={item.claimedBy} />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <footer className="no-print py-8 text-center text-xs text-ink-soft">
        A little elf-made app for the {kid.year.year} season. 🎄
      </footer>
    </main>
  );
}
