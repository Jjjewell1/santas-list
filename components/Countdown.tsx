'use client';

import { useEffect, useMemo, useState } from 'react';

function getTarget(): Date {
  const now = new Date();
  const year = now.getMonth() === 11 && now.getDate() > 25 ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(year, 11, 25, 0, 0, 0);
}

function diff(target: Date) {
  const now = new Date();
  const ms = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function Countdown({ compact = false }: { compact?: boolean }) {
  const target = useMemo(getTarget, []);
  const [d, setD] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setD(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells = [
    { label: 'days', value: d.days },
    { label: 'hours', value: d.hours },
    { label: 'minutes', value: d.minutes },
    { label: 'seconds', value: d.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {cells.map((c) => (
        <div
          key={c.label}
          className="flex flex-col items-center rounded-2xl bg-white/10 px-3 py-2 backdrop-blur-sm sm:px-5 sm:py-3"
        >
          <span className="font-display text-3xl font-semibold tabular-nums text-white sm:text-5xl">
            {String(c.value).padStart(2, '0')}
          </span>
          <span className="text-[10px] font-display uppercase tracking-widest text-gold-200 sm:text-xs">
            {c.label}
          </span>
        </div>
      ))}
      {!compact && (
        <p className="sr-only">until Christmas morning</p>
      )}
    </div>
  );
}
