'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveKidSetup } from '@/app/actions/admin-actions';

interface Props {
  kidId: number;
  bigBudget: number | null;
  smallBudget: number | null;
  softCeilingEnabled: boolean;
  softCeilingPct: number;
  wildcardEnabled: boolean;
  locked: boolean;
}

const toDollars = (cents: number | null) => (cents == null ? '' : (cents / 100).toFixed(2));

export default function KidSetupForm({ kidId, bigBudget, smallBudget, softCeilingEnabled, softCeilingPct, wildcardEnabled, locked }: Props) {
  const router = useRouter();
  const [big, setBig] = useState(toDollars(bigBudget));
  const [small, setSmall] = useState(toDollars(smallBudget));
  const [ceiling, setCeiling] = useState(softCeilingEnabled);
  const [pct, setPct] = useState(String(softCeilingPct));
  const [wildcard, setWildcard] = useState(wildcardEnabled);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await saveKidSetup(kidId, big, small, ceiling, Number(pct) || 60, wildcard);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    });
  };

  return (
    <div className="card p-5">
      <h3 className="mb-4 font-display text-lg font-bold text-pine-900">Per-kid setup</h3>
      {locked && (
        <p className="mb-3 rounded-lg bg-gold-100 p-3 text-sm font-semibold text-pine-900">
          🔒 This season is locked — budgets are read-only.
        </p>
      )}
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="big" className="label">🎁 Big Gift budget</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-ink-soft">$</span>
              <input
                id="big"
                className="input pl-7"
                inputMode="decimal"
                placeholder="e.g. 300"
                value={big}
                disabled={locked}
                onChange={(e) => setBig(e.target.value)}
              />
            </div>
            <p className="mt-1 text-xs text-ink-soft">Up to 3 items, split however the kid likes.</p>
          </div>
          <div>
            <label htmlFor="small" className="label">🧦 Small Gift budget</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-ink-soft">$</span>
              <input
                id="small"
                className="input pl-7"
                inputMode="decimal"
                placeholder="e.g. 75"
                value={small}
                disabled={locked}
                onChange={(e) => setSmall(e.target.value)}
              />
            </div>
            <p className="mt-1 text-xs text-ink-soft">Up to 5 items, split however the kid likes.</p>
          </div>
        </div>

        <div className="rounded-xl bg-pine-50 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={ceiling}
              disabled={locked}
              onChange={(e) => setCeiling(e.target.checked)}
              className="mt-1 h-4 w-4 accent-pine-700"
            />
            <span>
              <span className="block font-display font-semibold text-pine-900">
                Prevent one item from using most of the budget?
              </span>
              <span className="block text-xs text-ink-soft">
                Stops a single gift from eating the whole category. Most parents leave this on.
              </span>
            </span>
          </label>
          {ceiling && (
            <div className="mt-3 flex items-center gap-2 pl-7">
              <label htmlFor="pct" className="text-sm font-semibold text-pine-800">
                Max share of a budget:
              </label>
              <input
                id="pct"
                className="input w-20 text-center"
                inputMode="numeric"
                value={pct}
                disabled={locked}
                onChange={(e) => setPct(e.target.value.replace(/\D/g, ''))}
              />
              <span className="text-sm text-ink-soft">%</span>
            </div>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={wildcard}
            disabled={locked}
            onChange={(e) => setWildcard(e.target.checked)}
            className="mt-1 h-4 w-4 accent-cran-600"
          />
          <span>
            <span className="block font-display font-semibold text-pine-900">🌟 Enable the One Special Wish slot</span>
            <span className="block text-xs text-ink-soft">
              One item with no price limit — the only slot allowed to break any budget.
            </span>
          </span>
        </label>

        {error && <p className="text-sm font-semibold text-cran-500">{error}</p>}
        {saved && <p className="text-sm font-semibold text-pine-700">✓ Saved</p>}

        <button type="button" className="btn-pine w-full sm:w-auto" disabled={locked || pending} onClick={submit}>
          {pending ? 'Saving…' : 'Save setup'}
        </button>
      </div>
    </div>
  );
}
