'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { claimItem, unclaimItem } from '@/app/actions/share-actions';

export default function ClaimControls({
  itemId,
  itemTitle,
  token,
  claimedBy,
}: {
  itemId: number;
  itemTitle: string;
  token: string;
  claimedBy: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(claimedBy ?? '');
  const [editing, setEditing] = useState(claimedBy == null);
  const [pending, startTransition] = useTransition();

  const claim = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await claimItem(itemId, name, token);
      setEditing(false);
      router.refresh();
    });
  };

  const unclaim = () => {
    startTransition(async () => {
      await unclaimItem(itemId, token);
      setEditing(false);
      setName('');
      router.refresh();
    });
  };

  return (
    <div className="no-print mt-1">
      {claimedBy ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-pine-100 px-2.5 py-1 text-xs font-bold text-pine-800">
            ✅ I&rsquo;ve got this — {claimedBy}
          </span>
          {!editing && (
            <button
              type="button"
              className="text-xs font-semibold text-ink-soft underline hover:text-pine-800"
              onClick={() => {
                setName(claimedBy);
                setEditing(true);
              }}
            >
              not you?
            </button>
          )}
          <button type="button" className="text-xs font-semibold text-cran-500 underline" disabled={pending} onClick={unclaim}>
            undo
          </button>
        </div>
      ) : editing ? (
        <div className="flex items-center gap-2">
          <input
            className="input w-36 py-1.5 text-xs"
            placeholder="Your name"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && claim()}
          />
          <button type="button" className="btn-pine px-3 py-1.5 text-xs" disabled={pending || !name.trim()} onClick={claim}>
            I&rsquo;ve got this
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn-ghost px-3 py-1 text-xs"
          onClick={() => {
            setName('');
            setEditing(true);
          }}
        >
          🙋 I&rsquo;ve got this
        </button>
      )}
      {claimedBy && <p className="mt-1 text-[11px] text-ink-soft">{itemTitle}</p>}
    </div>
  );
}
