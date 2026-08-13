import { prisma } from '@/lib/prisma';

export default async function ActivityPage() {
  const entries = await prisma.activity.findMany({ orderBy: { createdAt: 'desc' }, take: 250 });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-pine-900">Activity log</h1>
        <p className="text-ink-soft">Everything that happened across the family lists — handy with six kids sharing devices.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-pine-100 text-xs font-display uppercase tracking-wider text-ink-soft">
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">Who</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-pine-50 last:border-0">
                  <td className="whitespace-nowrap px-5 py-2.5 text-xs text-ink-soft">
                    {e.createdAt.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-2.5 font-semibold text-pine-900">{e.actor}</td>
                  <td className="px-5 py-2.5 text-pine-800">{e.action}</td>
                  <td className="max-w-xs truncate px-5 py-2.5 text-ink-soft">{e.detail}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-ink-soft">
                    Nothing logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
