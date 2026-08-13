'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addKid } from '@/app/actions/admin-actions';
import { AVATAR_CHOICES, COLOR_CHOICES } from '@/lib/constants';

export default function AddKidForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🎄');
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!name.trim()) {
      setError('Give them a name first!');
      return;
    }
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('name', name);
      fd.set('avatar', avatar);
      fd.set('color', color);
      const res = await addKid(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setName('');
      router.refresh();
    });
  };

  return (
    <div className="card p-5">
      <h3 className="mb-3 font-display text-lg font-bold text-pine-900">Add a kid</h3>
      <div className="flex flex-col gap-3">
        <input
          className="input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />

        <div>
          <p className="label">Avatar</p>
          <div className="flex flex-wrap gap-1.5">
            {AVATAR_CHOICES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={`rounded-xl border-2 p-1 text-xl transition-all ${
                  avatar === a ? 'border-gold-400 bg-gold-100' : 'border-transparent hover:bg-pine-50'
                }`}
                aria-label={`Avatar ${a}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label">Color</p>
          <div className="flex flex-wrap gap-2">
            {COLOR_CHOICES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  color === c ? 'scale-110 border-pine-900' : 'border-white'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm font-semibold text-cran-500">{error}</p>}

        <button type="button" className="btn-pine" disabled={pending} onClick={submit}>
          {pending ? 'Adding…' : '+ Add kid'}
        </button>
      </div>
    </div>
  );
}
