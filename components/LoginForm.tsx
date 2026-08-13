'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { parentLogin, setupAdmin } from '@/app/actions/auth-actions';

export default function LoginForm({ mode }: { mode: 'login' | 'setup' }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
          autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
          minLength={mode === 'setup' ? 8 : undefined}
          className="input"
          placeholder={mode === 'setup' ? 'At least 8 characters' : undefined}
        />
      </div>
      <button type="submit" disabled={pending} className={mode === 'setup' ? 'btn-cran w-full' : 'btn-pine w-full'}>
        {pending ? 'Working…' : mode === 'setup' ? 'Create parent account' : 'Sign in'}
      </button>
      {error && <p className="text-sm font-semibold text-cran-500">{error}</p>}
    </form>
  );
}
