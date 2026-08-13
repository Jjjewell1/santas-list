import Link from 'next/link';
import Countdown from '@/components/Countdown';
import TwelveDaysBoard from '@/components/TwelveDaysBoard';
import { prisma } from '@/lib/prisma';
import { getCurrentYear } from '@/lib/year';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const year = await getCurrentYear();
  const traditions = year
    ? await prisma.tradition.findMany({ where: { yearId: year.id }, orderBy: { day: 'asc' } })
    : [];

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-pine-950 via-pine-900 to-pine-700">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 10%, rgba(212,160,23,0.18), transparent 40%), radial-gradient(circle at 85% 20%, rgba(180,35,54,0.22), transparent 45%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-16 text-center sm:py-24">
          <h1 className="font-display text-5xl font-bold tracking-tight text-white sm:text-7xl">
            Santa&rsquo;s List
          </h1>
          <p className="max-w-md font-display text-lg text-gold-200">
            One list for the whole family. Make yours, share it, and let the magic begin. 🎁
          </p>

          <Countdown />

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link href="/kid" className="btn-gold px-8 py-4 text-lg">
              🎄 Kids — open your list
            </Link>
            <Link href="/login" className="btn-ghost px-8 py-4 text-lg">
              Parents
            </Link>
          </div>
        </div>
      </section>

      {/* 12 Days of Christmas */}
      <section className="mx-auto max-w-4xl px-4 py-14">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-bold text-pine-900 sm:text-4xl">
            12 Days of Christmas
          </h2>
          <p className="mt-2 text-ink-soft">
            Tap a card to flip it. One new surprise unlocks each day from Dec 13 to Dec 24.
          </p>
        </div>
        <TwelveDaysBoard traditions={traditions.map((t) => ({
          day: t.day,
          title: t.title,
          description: t.description,
          photoUrl: t.photoUrl,
        }))} year={year?.year ?? new Date().getFullYear()} />
      </section>

      <footer className="py-10 text-center text-sm text-ink-soft">
        Made with ❤️ and way too much hot chocolate. See you Christmas morning!
      </footer>
    </main>
  );
}
