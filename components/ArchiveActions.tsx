'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { archiveCurrentYear, prepareNextYear, setLockDays } from '@/app/actions/admin-actions';

export default function ArchiveActions({ lockDays }: { lockDays: number | null }) {
  const router = useRouter();
  const [days, setDays] = useState(lockDays == null ? '' : String(lockDays));
  const [copyKids, setCopyKids] = useState(true);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean }>, success: string) => {
    setMsg(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setMsg(success);
        router.refresh();
      }
    });
  };

  return (
    <div className="card flex flex-col gap-4 p-5">
      <h3 className="font-display text-lg font-bold text-pine-900">Season management</h3>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div>
          <label htmlFor="lockdays" className="label">Auto-lock lists N days before Christmas</label>
          <input
            id="lockdays"
            className="input w-32 text-center"
            inputMode="numeric"
            placeholder="off"
            value={days}
            onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))}
          />
        </div>
        <button
          type="button"
          className="btn-ghost"
          disabled={pending}
          onClick={() => run(() => setLockDays(days ? Number(days) : 0), 'Auto-lock setting saved.')}
        >
          Save
        </button>
      </div>

      <div className="rounded-xl bg-pine-50 p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-pine-900">
          <input type="checkbox" checked={copyKids} onChange={(e) => setCopyKids(e.target.checked)} className="h-4 w-4 accent-pine-700" />
          Copy kids &amp; budgets to next year
        </label>
        <p className="mt-1 text-xs text-ink-soft">
          Starts next year&rsquo;s season with the same profiles (fresh wishlists, no items carried over).
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="btn-pine"
          disabled={pending}
          onClick={() => run(() => prepareNextYear(copyKids), 'Next season is ready — switch to it when you archive this one.')}
        >
          📅 Prepare next season
        </button>
        <button
          type="button"
          className="btn-cran"
          disabled={pending}
          onClick={() => {
            if (confirm('Archive the current season? Lists become read-only and a new season starts.')) {
              run(() => archiveCurrentYear(), 'Season archived. Happy new Christmas!');
            }
          }}
        >
          🔒 Archive current season
        </button>
      </div>

      {msg && <p className="rounded-lg bg-pine-50 p-3 text-sm font-semibold text-pine-800">{msg}</p>}
    </div>
  );
}
