'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { parentLogin, setupAdmin } from '@/app/actions/auth-actions';

export default function LoginForm({ mode }: { mode: 'login' | 'setup' }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pin, setPin] = useState('');

  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await (mode === 'setup' ? setupAdmin(formData) : parentLogin(formData));
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  if (mode === 'login') {
    return (
      <form action={submit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="pin" className="label">
            Parent PIN
          </label>
          <input
            id="pin"
            name="pin"
            inputMode="numeric"
            maxLength={4}
            pattern="\d{4}"
            autoComplete="one-time-code"
            autoFocus
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="input text-center font-display text-3xl tracking-[0.6em]"
          />
        </div>
        <button type="submit" disabled={pending || pin.length !== 4} className="btn-pine w-full">
          {pending ? 'Working…' : 'Open the workshop'}
        </button>
        {error && <p className="text-sm font-semibold text-cran-500">{error}</p>}
      </form>
    );
  }

  return (
    <form action={submit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="label">
          Email or username
        </label>
        <input id="email" name="email" type="text" required autoComplete="username" className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="input"
          placeholder="At least 8 characters"
        />
      </div>
      <button type="submit" disabled={pending} className="btn-cran w-full">
        {pending ? 'Working…' : 'Create parent account'}
      </button>
      {error && <p className="text-sm font-semibold text-cran-500">{error}</p>}
    </form>
  );
}
