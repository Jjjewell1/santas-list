import Link from 'next/link';
import { redirect } from 'next/navigation';
import KidAvatar from '@/components/KidAvatar';
import { prisma } from '@/lib/prisma';
import { getCurrentYear } from '@/lib/year';
import { verifySession } from '@/lib/session';

export default async function KidPickerPage() {
  const session = await verifySession();
  if (session?.role === 'kid') redirect(`/kid/${session.kidId}/list`);

  const year = await getCurrentYear();
  const kids = year
    ? await prisma.kid.findMany({ where: { yearId: year.id }, orderBy: { position: 'asc' } })
    : [];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-pine-950 via-pine-900 to-pine-700 px-4 py-12">
      <Link href="/" className="mb-6 text-sm font-display font-semibold text-gold-300 hover:text-gold-200">
        ← Back to the front yard
      </Link>
      <h1 className="mb-2 text-center text-3xl font-bold text-white sm:text-4xl">Who&rsquo;s opening their list?</h1>
      <p className="mb-8 text-center font-display text-gold-200">Tap your name — then enter your secret PIN.</p>

      {kids.length === 0 ? (
        <div className="card max-w-sm p-8 text-center">
          <p className="text-ink-soft">No lists yet. Ask a parent to set up this year!</p>
        </div>
      ) : (
        <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
          {kids.map((kid) => (
            <Link
              key={kid.id}
              href={`/kid/${kid.id}`}
              className="card flex flex-col items-center gap-3 p-5 text-center transition-transform hover:-translate-y-1 hover:shadow-lift"
            >
              <KidAvatar avatar={kid.avatar} color={kid.color} size="lg" />
              <span className="font-display text-xl font-bold text-pine-900">{kid.name}</span>
              <span className="text-xs font-semibold text-ink-soft">Tap to open 🎁</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
