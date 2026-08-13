import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import KidAvatar from '@/components/KidAvatar';
import KidPinForm from '@/components/KidPinForm';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export default async function KidPinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kidId = Number(id);
  if (!Number.isInteger(kidId)) notFound();

  const session = await verifySession();
  if (session?.role === 'kid') {
    redirect(session.kidId === kidId ? `/kid/${kidId}/list` : `/kid/${session.kidId}/list`);
  }

  const kid = await prisma.kid.findUnique({ where: { id: kidId } });
  if (!kid) notFound();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-pine-950 via-pine-900 to-pine-700 px-4 py-12">
      <Link href="/kid" className="mb-6 text-sm font-display font-semibold text-gold-300 hover:text-gold-200">
        ← Pick a different name
      </Link>
      <div className="card flex w-full max-w-sm flex-col items-center gap-4 p-8">
        <KidAvatar avatar={kid.avatar} color={kid.color} size="lg" />
        <h1 className="text-2xl font-bold text-pine-900">Hi, {kid.name}!</h1>
        <p className="text-sm text-ink-soft">Enter your secret 4-digit PIN to open your list.</p>
        {kid.pinHash ? (
          <KidPinForm kidId={kid.id} kidName={kid.name} />
        ) : (
          <div className="w-full rounded-xl bg-gold-100 p-4 text-center">
            <p className="text-sm font-semibold text-pine-800">
              Your account isn&rsquo;t set up yet. Ask a parent to give you a PIN first! 🎄
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
