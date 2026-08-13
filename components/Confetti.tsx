'use client';

import { useMemo } from 'react';

const COLORS = ['#b42336', '#d4a017', '#1a6a50', '#7c3aed', '#0ea5e9', '#db2777'];

/** One-shot confetti burst rendered over its parent. */
export default function Confetti({ trigger }: { trigger: number }) {
  const pieces = useMemo(
    () =>
      trigger > 0
        ? Array.from({ length: 42 }, (_, i) => ({
            id: `${trigger}-${i}`,
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 40}%`,
            dx: `${Math.random() * 120 - 60}px`,
            dy: `${80 + Math.random() * 120}px`,
            rot: `${Math.random() * 480 - 120}deg`,
            w: 6 + Math.random() * 6,
            h: 8 + Math.random() * 8,
            dur: `${0.7 + Math.random() * 0.5}s`,
            color: COLORS[i % COLORS.length],
          }))
        : [],
    [trigger]
  );

  if (trigger === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece rounded-sm"
          style={{
            left: p.x,
            top: p.y,
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            ['--confetti-x' as string]: p.dx,
            ['--confetti-y' as string]: p.dy,
            ['--confetti-rot' as string]: p.rot,
            ['--confetti-duration' as string]: p.dur,
          }}
        />
      ))}
    </div>
  );
}
