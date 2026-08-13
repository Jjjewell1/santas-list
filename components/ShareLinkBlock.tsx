'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function ShareLinkBlock({
  url,
  label,
  regenerate,
  revoke,
}: {
  url: string | null;
  label: string;
  regenerate: () => Promise<{ ok: boolean; token?: string }>;
  revoke: () => Promise<{ ok: boolean }>;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotice(url);
    }
  };

  const run = (fn: () => Promise<{ ok: boolean }>, success: string) => {
    setNotice(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setNotice(success);
        router.refresh();
      }
    });
  };

  return (
    <div className="card p-5">
      <h3 className="mb-1 font-display text-lg font-bold text-pine-900">{label}</h3>
      <p className="mb-3 text-sm text-ink-soft">
        Anyone with this link can view the list and mark items as &ldquo;I&rsquo;ve got this&rdquo; — claim
        status is never shown to the kids.
      </p>

      {url ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input readOnly value={url} className="input flex-1 truncate bg-pine-50" onFocus={(e) => e.target.select()} />
            <button type="button" className="btn-pine shrink-0" onClick={copy}>
              {copied ? '✓ Copied' : 'Copy link'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-ghost py-2 text-sm"
              disabled={pending}
              onClick={() => run(regenerate, 'Link regenerated — the old one no longer works.')}
            >
              🔄 Regenerate link
            </button>
            <button
              type="button"
              className="btn-ghost py-2 text-sm text-cran-600"
              disabled={pending}
              onClick={() => run(revoke, 'Link revoked — nobody can view it anymore.')}
            >
              🚫 Revoke link
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm font-semibold text-ink-soft">No link yet.</p>
          <button
            type="button"
            className="btn-pine"
            disabled={pending}
            onClick={() => run(regenerate, 'Share link created!')}
          >
            ✨ Create share link
          </button>
        </div>
      )}

      {notice && <p className="mt-3 break-all rounded-lg bg-pine-50 p-2 text-xs text-pine-800">{notice}</p>}
    </div>
  );
}
