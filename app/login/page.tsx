import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import LoginForm from '@/components/LoginForm';

export default async function LoginPage() {
  const session = await verifySession();
  if (session?.role === 'parent') redirect('/admin');

  const adminCount = await prisma.admin.count();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-pine-950 via-pine-900 to-pine-700 px-4 py-12">
      <Link href="/" className="mb-6 text-sm font-display font-semibold text-gold-300 hover:text-gold-200">
        ← Back to the front yard
      </Link>
      <div className="card w-full max-w-sm p-8">
        <h1 className="mb-1 text-center text-2xl font-bold text-pine-900">Parents&rsquo; Workshop</h1>
        <p className="mb-6 text-center text-sm text-ink-soft">
          {adminCount > 0 ? 'Enter your 4-digit PIN to manage this year\u2019s lists.' : 'Create the first parent account.'}
        </p>
        <LoginForm mode={adminCount > 0 ? 'login' : 'setup'} />
      </div>
      <p className="mt-6 max-w-sm text-center text-xs text-pine-200/70">
        Kids, you don&rsquo;t need a password — <Link href="/kid" className="underline">tap here</Link> to open your list.
      </p>
    </main>
  );
}
