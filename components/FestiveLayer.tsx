'use client';

import { useEffect, useMemo, useState } from 'react';

const SNOW_COUNT = 48;
const BULB_COUNT = 18;
const BULB_COLORS = ['#b42336', '#d4a017', '#0e7c86', '#7c3aed', '#1a6a50'];

interface Flake {
  left: string;
  size: number;
  duration: string;
  delay: string;
  opacity: number;
  drift: string;
}

interface Bulb {
  left: string;
  color: string;
  duration: string;
  delay: string;
}

export default function FestiveLayer() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('xmas_festive');
    setEnabled(stored === null ? true : stored === '1');
  }, []);

  const flakes = useMemo<Flake[]>(
    () =>
      Array.from({ length: SNOW_COUNT }, () => ({
        left: `${Math.random() * 100}%`,
        size: 4 + Math.random() * 6,
        duration: `${7 + Math.random() * 9}s`,
        delay: `${-Math.random() * 16}s`,
        opacity: 0.4 + Math.random() * 0.5,
        drift: `${Math.random() * 40 - 20}px`,
      })),
    []
  );

  const bulbs = useMemo<Bulb[]>(
    () =>
      Array.from({ length: BULB_COUNT }, () => ({
        left: `${(Math.random() * 96 + 2).toFixed(1)}%`,
        color: BULB_COLORS[Math.floor(Math.random() * BULB_COLORS.length)],
        duration: `${1.6 + Math.random() * 2.4}s`,
        delay: `${Math.random() * 3}s`,
      })),
    []
  );

  if (enabled === null) return null;
  const on = enabled;

  return (
    <>
      {/* Twinkle lights along the top */}
      {on && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-3">
          <div className="absolute inset-0 bg-gradient-to-b from-pine-900/60 to-transparent" />
          {bulbs.map((b, i) => (
            <span
              key={i}
              className="light-bulb absolute top-1 h-2.5 w-2.5 rounded-full shadow-[0_0_8px_2px_rgba(255,255,255,0.35)]"
              style={{
                left: b.left,
                backgroundColor: b.color,
                ['--twinkle-duration' as string]: b.duration,
                ['--twinkle-delay' as string]: b.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* Snowfall */}
      {on && (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
          {flakes.map((f, i) => (
            <span
              key={i}
              className="snowflake rounded-full bg-white"
              style={{
                left: f.left,
                width: f.size,
                height: f.size,
                opacity: f.opacity,
                animationDuration: f.duration,
                animationDelay: f.delay,
                transform: `translateX(${f.drift})`,
              }}
            />
          ))}
        </div>
      )}

      {/* Toggle */}
      <button
        type="button"
        onClick={() => {
          const next = on;
          setEnabled(next);
          localStorage.setItem('xmas_festive', next ? '1' : '0');
        }}
        className="fixed bottom-3 right-3 z-50 rounded-full border border-pine-200 bg-white/90 px-3 py-1.5 text-xs font-display font-semibold text-pine-800 shadow-soft backdrop-blur"
        aria-pressed={on}
        title={on ? 'Turn off snow & lights' : 'Turn on snow & lights'}
      >
        {on ? '❄️ On' : '❄️ Off'}
      </button>
    </>
  );
}
