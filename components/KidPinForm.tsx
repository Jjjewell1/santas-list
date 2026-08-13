'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { kidLogin } from '@/app/actions/auth-actions';

export default function KidPinForm({ kidId, kidName }: { kidId: number; kidName: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (pin.length !== 4) {
      setError('Enter all 4 digits.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await kidLogin(kidId, pin);
      if (res?.error) {
        setError(res.error);
        setPin('');
        inputRef.current?.focus();
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="w-full max-w-xs">
      <label htmlFor="pin" className="sr-only">Your 4-digit PIN</label>
      <input
        ref={inputRef}
        id="pin"
        inputMode="numeric"
        autoFocus
        maxLength={4}
        pattern="\d{4}"
        autoComplete="one-time-code"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        placeholder="••••"
        className="input text-center font-display text-3xl tracking-[0.6em]"
        aria-label={`${kidName}'s 4-digit PIN`}
      />
      {error && <p className="mt-3 text-center text-sm font-semibold text-cran-400">{error}</p>}

      <div className="mt-4 flex justify-center gap-2">
        {[1, 2, 3, 4].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              if (pin.length < 4) {
                setPin((p) => p + d);
                setError(null);
              }
            }}
            className="btn-ghost h-16 w-14 text-xl font-bold"
            aria-label={`Digit ${d}`}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-center gap-2">
        {[5, 6, 7, 8].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              if (pin.length < 4) {
                setPin((p) => p + d);
                setError(null);
              }
            }}
            className="btn-ghost h-16 w-14 text-xl font-bold"
            aria-label={`Digit ${d}`}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-center gap-2">
        {[9, 0].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              if (pin.length < 4) {
                setPin((p) => p + d);
                setError(null);
              }
            }}
            className="btn-ghost h-16 w-14 text-xl font-bold"
            aria-label={`Digit ${d}`}
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPin((p) => p.slice(0, -1))}
          className="btn-ghost h-16 w-14 text-xl"
          aria-label="Delete digit"
        >
          ⌫
        </button>
      </div>

      <button type="button" onClick={submit} disabled={pending} className="btn-gold mt-5 w-full text-lg">
        {pending ? 'Checking…' : 'Open my list 🎁'}
      </button>
    </div>
  );
}
