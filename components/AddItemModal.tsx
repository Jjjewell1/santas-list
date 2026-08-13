'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addItem } from '@/app/actions/item-actions';
import type { Category } from '@/lib/budget';
import { CATEGORY_META, formatMoney } from '@/lib/budget';

interface AddItemModalProps {
  kidId: number;
  category: Category;
  wildcardEnabled: boolean;
  initialUrl?: string | null;
  onClose: () => void;
  onAdded: () => void;
}

interface ScrapedPreview {
  title: string;
  imageUrl: string | null;
  price: number | null;
  url: string;
}

export default function AddItemModal({ kidId, category, wildcardEnabled, initialUrl, onClose, onAdded }: AddItemModalProps) {
  const router = useRouter();
  const meta = CATEGORY_META[category];
  const [pending, startTransition] = useTransition();

  const [url, setUrl] = useState(initialUrl ?? '');
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ScrapedPreview | null>(null);
  const [manual, setManual] = useState(false);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [overBudgetInfo, setOverBudgetInfo] = useState<{ used: number; budget: number } | null>(null);
  const [ceilingInfo, setCeilingInfo] = useState<number | null>(null);
  const [addingAsWildcard, setAddingAsWildcard] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);

  const doScrape = useCallback(async (target: string) => {
    setScraping(true);
    setScrapeError(null);
    setOverBudgetInfo(null);
    setCeilingInfo(null);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok || data.title) {
        setScrapeError(data.error ?? 'Couldn\u2019t read that page.');
        setManual(true);
        setProductUrl(target.trim());
        return;
      }
      setPreview({ title: data.title, imageUrl: data.imageUrl, price: data.price, url: data.url });
      setTitle(data.title);
      setPrice(data.price != null ? String(data.price) : '');
      setImageUrl(data.imageUrl ?? '');
      setProductUrl(data.url);
      setManual(false);
    } catch {
      setScrapeError('Couldn\u2019t reach that page.');
      setManual(true);
      setProductUrl(target.trim());
    } finally {
      setScraping(false);
    }
  }, []);

  useEffect(() => {
    if (initialUrl) doScrape(initialUrl);
  }, [initialUrl, doScrape]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (cat: Category, useManual: boolean) => {
    const finalTitle = (useManual ? title : preview?.title ?? title).trim();
    const finalPrice = (useManual ? price : price).trim();
    const cents = finalPrice === '' ? null : Math.round(parseFloat(finalPrice.replace(/[$,\s]/g, '')) * 100);
    if (!finalTitle) {
      setAddError('Give it a name first!');
      return;
    }
    setAddError(null);
    setOverBudgetInfo(null);
    setCeilingInfo(null);
    setAddingAsWildcard(cat === 'wildcard');

    startTransition(async () => {
      const res = await addItem(
        kidId,
        cat,
        finalTitle,
        Number.isFinite(cents) ? cents : null,
        (useManual ? imageUrl : preview?.imageUrl ?? imageUrl).trim() || null,
        (useManual ? productUrl : productUrl).trim() || null
      );
      if (res.ok) {
        onAdded();
        onClose();
        router.refresh();
        return;
      }
      if (res.reason === 'over-budget' && res.budget != null) {
        setOverBudgetInfo({ used: res.budgetUsed ?? 0, budget: res.budget });
      } else if (res.reason === 'over-ceiling') {
        setCeilingInfo(res.ceiling ?? 0);
      } else if (res.reason === 'max-items') {
        setAddError('That section is already full!');
      } else {
        setAddError('That couldn\u2019t be added. It might not fit the rules.');
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-pine-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Add to ${meta.label}`}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-snow p-6 shadow-lift sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-pine-900">
            {meta.icon} Add to {meta.label}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2 text-sm" aria-label="Close">
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm text-ink-soft">{meta.blurb}</p>

        {/* URL look-up */}
        {!manual && (
          <div className="mb-3 flex gap-2">
            <input
              className="input"
              placeholder="Paste a product link, e.g. amazon.com/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && url.trim() && doScrape(url.trim())}
              disabled={scraping}
            />
            <button type="button" className="btn-pine shrink-0" onClick={() => url.trim() && doScrape(url.trim())} disabled={scraping || !url.trim()}>
              {scraping ? '…' : 'Look up'}
            </button>
          </div>
        )}

        {scraping && <p className="mb-2 text-sm text-ink-soft">Fetching details from the store…</p>}
        {scrapeError && manual && (
          <p className="mb-2 text-sm font-semibold text-cran-500">{scrapeError}</p>
        )}

        {/* Preview from scrape */}
        {preview && manual && (
          <div className="mb-3 flex gap-3 rounded-2xl border border-pine-100 bg-white p-3 shadow-card">
            {preview.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-pine-50 text-3xl">🎁</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display font-semibold text-pine-900">{preview.title}</p>
              <p className="text-sm font-semibold text-cran-600">
                {preview.price != null ? formatMoney(Math.round(preview.price * 100)) : 'No price found'}
              </p>
              <p className="mt-1 truncate text-xs text-ink-soft">{preview.url.replace(/^https?:\/\//, '')}</p>
            </div>
          </div>
        )}

        {/* Editable fields */}
        {(manual || preview) && (
          <div className="mb-3 flex flex-col gap-3">
            <div>
              <label className="label">What is it?</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="label">Price (optional)</label>
              <input className="input" inputMode="decimal" placeholder="e.g. 24.99" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label className="label">Image link (optional)</label>
              <input className="input" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </div>
            <div>
              <label className="label">Product link (optional)</label>
              <input className="input" placeholder="https://…" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} />
            </div>
          </div>
        )}

        {!manual && (
          <button type="button" className="mb-3 text-sm font-semibold text-pine-700 underline" onClick={() => setManual(true)}>
            Can&rsquo;t fetch it? Enter details yourself.
          </button>
        )}
        {manual && (
          <button type="button" className="mb-3 text-sm font-semibold text-pine-700 underline" onClick={() => { setManual(false); setScrapeError(null); }}>
            ← Try the link again
          </button>
        )}

        {/* Errors */}
        {addError && <p className="mb-2 text-sm font-semibold text-cran-500">{addError}</p>}
        {overBudgetInfo && (
          <div className="mb-3 rounded-xl bg-gold-100 p-3 text-sm">
            <p className="font-semibold text-pine-900">
              This would put you over budget! You have {formatMoney(overBudgetInfo.budget - overBudgetInfo.used)} left
              in {meta.label}.
            </p>
            <p className="mt-1 text-ink-soft">Remove something else, or pick something a little smaller.</p>
            {category == 'wildcard' && wildcardEnabled && (
              <button type="button" className="btn-gold mt-2 w-full py-2" onClick={() => submit('wildcard', manual)}>
                Use it as my One Special Wish instead ✨
              </button>
            )}
          </div>
        )}
        {ceilingInfo && (
          <div className="mb-3 rounded-xl bg-cran-50 p-3 text-sm">
            <p className="font-semibold text-cran-600">
              That single item is bigger than the allowed share — keep it at or under {formatMoney(ceilingInfo)}.
            </p>
            {category == 'wildcard' && wildcardEnabled && (
              <button type="button" className="btn-gold mt-2 w-full py-2" onClick={() => submit('wildcard', manual)}>
                Make it my One Special Wish instead ✨
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          className="btn-pine w-full text-lg"
          disabled={pending || (!preview && manual)}
          onClick={() => submit(category, manual)}
        >
          {addingAsWildcard ? 'Adding as Special Wish…' : `Add to ${meta.label}`}
        </button>
      </div>
    </div>
  );
}
