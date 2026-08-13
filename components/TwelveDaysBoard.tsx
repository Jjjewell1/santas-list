'use client';

import { useState } from 'react';

interface TraditionDTO {
  day: number;
  title: string;
  description: string;
  photoUrl: string | null;
}

const DAY_ICONS = ['🎄', '⛄', '🎁', '🕯️', '🦌', '🎅', '🍪', '🧦', '🌟', '🔔', '❄️', '🥛'];

export default function TwelveDaysBoard({
  traditions,
  year,
}: {
  traditions: TraditionDTO[];
  year: number;
}) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  const byDay = new Map(traditions.map((t) => [t.day, t]));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const unlockDate = (day: number) => new Date(year, 11, 13 + (day - 1));
  const isUnlocked = (day: number) => unlockDate(day) <= today;

  const toggle = (day: number) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((day) => {
          const trad = byDay.get(day);
          const unlocked = isUnlocked(day);
          const isFlipped = flipped.has(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              aria-label={unlocked ? `Day ${day}: ${trad?.title ?? ''}` : `Day ${day} (locked)`}
              className={`flip-card ${isFlipped ? 'flipped' : ''} aspect-[3/4] h-44 w-full text-left`}
            >
              <div className="flip-inner h-full w-full">
                {/* Front */}
                <div
                  className={`flip-face flex h-full w-full flex-col items-center justify-center rounded-2xl border-2 p-2 text-center shadow-card transition-colors ${
                    unlocked
                      ? 'border-gold-300 bg-gradient-to-br from-pine-800 to-pine-600 text-white'
                      : 'border-pine-200 bg-pine-50 text-pine-400'
                  }`}
                >
                  <span className="text-3xl">{unlocked ? DAY_ICONS[day - 1] : '🔒'}</span>
                  <span className="mt-1 font-display text-lg font-bold">Day {day}</span>
                  {!unlocked && (
                    <span className="mt-1 text-[11px] font-semibold">
                      Opens Dec {13 + (day - 1)}
                    </span>
                  )}
                </div>
                {/* Back */}
                <div
                  className={`flip-face flip-back flex h-full w-full flex-col overflow-hidden rounded-2xl border-2 shadow-card ${
                    unlocked ? 'border-gold-300 bg-white' : 'border-pine-200 bg-white'
                  }`}
                >
                  {unlocked ? (
                    <>
                      {trad?.photoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={trad.photoUrl}
                          alt=""
                          loading="lazy"
                          className="h-16 w-full object-cover"
                        />
                      )}
                      <div className="flex flex-1 flex-col gap-1 overflow-hidden p-2">
                        <span className="font-display text-sm font-bold leading-tight text-pine-900">
                          {trad?.title ?? `Day ${day}`}
                        </span>
                        <span className="text-xs leading-snug text-ink-soft">
                          {trad?.description}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 p-3 text-center">
                      <span className="text-2xl">🎄</span>
                      <span className="text-xs font-semibold text-ink-soft">
                        A surprise is hiding here!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
