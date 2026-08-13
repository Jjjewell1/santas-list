'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveTradition, deleteTradition } from '@/app/actions/admin-actions';

interface TraditionDTO {
  day: number;
  title: string;
  description: string;
  photoUrl: string | null;
}

const DAY_ICONS = ['🎄', '⛄', '🎁', '🕯️', '🦌', '🎅', '🍪', '🧦', '🌟', '🔔', '❄️', '🥛'];

export default function TraditionEditor({ traditions, year }: { traditions: TraditionDTO[]; year: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Record<number, TraditionDTO>>(
    Object.fromEntries(traditions.map((t) => [t.day, { ...t, photoUrl: t.photoUrl ?? '' }]))
  );
  const [pending, startTransition] = useTransition();
  const [savedDay, setSavedDay] = useState<number | null>(null);

  const get = (day: number): TraditionDTO =>
    editing[day] ?? { day, title: '', description: '', photoUrl: '' };

  const set = (day: number, patch: Partial<TraditionDTO>) =>
    setEditing((prev) => ({ ...prev, [day]: { ...get(day), ...patch } }));

  const save = (day: number) => {
    startTransition(async () => {
      const t = get(day);
      const res = await saveTradition(day, t.title, t.description, t.photoUrl ?? '');
      if (res.ok) {
        setSavedDay(day);
        setTimeout(() => setSavedDay(null), 1500);
        router.refresh();
      }
    });
  };

  const clear = (day: number) => {
    if (!confirm('Clear this day\u2019s activity?')) return;
    startTransition(async () => {
      await deleteTradition(day);
      setEditing((prev) => {
        const next = { ...prev };
        delete next[day];
        return next;
      });
      router.refresh();
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((day) => {
        const t = get(day);
        const unlock = new Date(year, 11, 13 + (day - 1));
        const filled = t.title.trim() == '';
        return (
          <div key={day} className="card flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold text-pine-900">
                {DAY_ICONS[day - 1]} Day {day}
              </span>
              <span className="rounded-full bg-pine-50 px-2 py-0.5 text-[11px] font-semibold text-pine-800">
                {filled ? '📝 filled' : 'empty'}
              </span>
            </div>
            <p className="text-xs text-ink-soft">Unlocks {unlock.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>

            <label className="label mb-1">Title</label>
            <input className="input py-2" placeholder={`Day ${day} activity`} value={t.title} onChange={(e) => set(day, { title: e.target.value })} />

            <label className="label mb-1">Description</label>
            <textarea
              className="input py-2"
              rows={3}
              placeholder="What's the family doing today?"
              value={t.description}
              onChange={(e) => set(day, { description: e.target.value })}
            />

            <label className="label mb-1">Photo link (optional)</label>
            <input className="input py-2" placeholder="https://…" value={t.photoUrl ?? ''} onChange={(e) => set(day, { photoUrl: e.target.value })} />

            <div className="mt-1 flex gap-2">
              <button type="button" className="btn-pine flex-1 py-2 text-sm" disabled={pending} onClick={() => save(day)}>
                {savedDay === day ? '✓ Saved' : 'Save'}
              </button>
              {filled && (
                <button type="button" className="btn-ghost px-3 py-2 text-sm text-cran-600" onClick={() => clear(day)}>
                  Clear
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
