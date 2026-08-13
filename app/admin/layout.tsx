import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireParent } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { getCurrentYear } from '@/lib/year';
import { logout } from '@/app/actions/auth-actions';
import Logo from '@/components/Logo';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '🏠' },
  { href: '/admin/kids', label: 'Kids & Sharing', icon: '🧒' },
  { href: '/admin/traditions', label: '12 Days Board', icon: '📅' },
  { href: '/admin/activity', label: 'Activity', icon: '📜' },
  { href: '/admin/archive', label: 'Archive', icon: '🗂️' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireParent();
  const year = await getCurrentYear();

  return (
    <div className="min-h-screen">
      <header className="border-b border-pine-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo small />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-pine-50 px-3 py-1 text-sm font-display font-semibold text-pine-800 sm:block">
              Season {year?.year ?? '—'}
            </span>
            <form action={logout}>
              <button type="submit" className="btn-ghost px-3 py-2 text-sm">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-display font-semibold text-pine-700 transition-colors hover:bg-pine-50"
            >
              {n.icon} {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
