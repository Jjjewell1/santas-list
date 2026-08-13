'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setKidPin } from '@/app/actions/admin-actions';

export default function PinManager({ kidId, hasPin, kidName }: { kidId: number; hasPin: boolean; kidName: string }) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (clear: boolean) => {
    setError(null);
    startTransition(async () => {
      const res = await setKidPin(kidId, clear ? '' : pin);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setPin('');
      router.refresh();
    });
  };

  return (
    <div className="card p-5">
      <h3 className="mb-1 font-display text-lg font-bold text-pine-900">PIN login</h3>
      <p className="mb-3 text-sm text-ink-soft">
        {hasPin ? `${kidName} has a 4-digit PIN. Set a new one below, or clear it to lock them out.` : `${kidName} has no PIN yet — set one so they can open their list.`}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label htmlFor="pin" className="label">New 4-digit PIN</label>
          <input
            id="pin"
            className="input w-40 text-center font-display text-lg tracking-[0.4em]"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          />
        </div>
        <button type="button" className="btn-pine" disabled={pending || pin.length !== 4} onClick={() => submit(false)}>
          Set PIN
        </button>
        {hasPin && (
          <button type="button" className="btn-ghost" disabled={pending} onClick={() => submit(true)}>
            Clear PIN
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-cran-500">{error}</p>}
    </div>
  );
}
