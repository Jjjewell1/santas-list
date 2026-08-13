'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteItem, moveItem, toggleSurprise } from '@/app/actions/item-actions';
import { CATEGORIES, CATEGORY_META, computeStats, formatMoney, spreadNudge, type Category } from '@/lib/budget';
import ProgressBar from './ProgressBar';
import AddItemModal from './AddItemModal';
import Confetti from './Confetti';

export interface KidItemDTO {
  id: number;
  title: string;
  imageUrl: string | null;
  price: number | null;
  productUrl: string | null;
  category: Category;
  surpriseFlag: boolean;
  position: number;
}

export interface KidConfigDTO {
  bigBudget: number | null;
  smallBudget: number | null;
  wildcardEnabled: boolean;
  softCeilingEnabled: boolean;
  softCeilingPct: number;
}

const HOVER_CLASSES: Record<Category, string> = {
  big: 'ring-pine-400',
  small: 'ring-gold-400',
  wildcard: 'ring-cran-400',
};

export default function KidListApp({
  kidId,
  name,
  items,
  config,
  locked,
  initialUrl,
}: {
  kidId: number;
  name: string;
  items: KidItemDTO[];
  config: KidConfigDTO;
  locked: boolean;
  initialUrl: string | null;
}) {
  const router = useRouter();
  const [modalCat, setModalCat] = useState<Category | null>(null);
  const [confetti, setConfetti] = useState(0);
  const [hover, setHover] = useState<{ category: Category; index: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dragItem = useRef<{ id: number; from: Category } | null>(null);
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const stats = CATEGORIES.reduce(
    (acc, c) => {
      acc[c] = computeStats(config, items, c);
      return acc;
    },
    {} as Record<Category, ReturnType<typeof computeStats>>
  );

  const grandTotal = items.reduce((s, i) => s + (i.price ?? 0), 0);

  const showMsg = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(null), 3500);
  };

  const handleDragStart = (e: React.DragEvent, item: KidItemDTO) => {
    dragItem.current = { id: item.id, from: item.category };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(item.id));
  };

  const handleDragOver = (e: React.DragEvent, category: Category) => {
    if (locked) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const container = containerRefs.current[category];
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const children = Array.from(container.children).filter(
      (c) => c instanceof HTMLElement && c.dataset.dragId
    ) as HTMLElement[];
    const y = e.clientY - rect.top;
    let index = children.length;
    for (let i = 0; i < children.length; i++) {
      const r = children[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) {
        index = i;
        break;
      }
    }
    setHover({ category, index });
  };

  const handleDrop = (e: React.DragEvent, category: Category) => {
    if (locked) return;
    e.preventDefault();
    const id = Number(e.dataTransfer.getData('text/plain') || dragItem.current?.id);
    const dropIndex = hover?.category === category ? hover.index : 0;
    setHover(null);
    if (!id || dragItem.current) return;

    startTransition(async () => {
      const res = await moveItem(id, category, dropIndex);
      if (!res.ok) showMsg(res.error ?? 'Couldn\u2019t move that.');
      router.refresh();
    });
  };

  const onAddSuccess = () => {
    setConfetti((c) => c + 1);
  };

  const categoriesInOrder = CATEGORIES.map((c) => ({ ...CATEGORY_META[c], key: c }));

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-4">
      <Confetti trigger={confetti} />

      {msg && (
        <div className="fixed left-1/2 top-4 z-40 -translate-x-1/2 rounded-xl bg-cran-600 px-4 py-2 text-sm font-semibold text-white shadow-lift">
          {msg}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between rounded-2xl bg-pine-800 px-5 py-4 text-white shadow-soft">
        <div>
          <p className="text-xs font-display uppercase tracking-widest text-gold-300">Hi, {name}!</p>
          <h2 className="font-display text-2xl font-bold">Your Christmas List</h2>
        </div>
        <span className="rounded-full bg-white/10 px-4 py-2 font-display text-lg font-semibold">
          {formatMoney(grandTotal)}
        </span>
      </div>

      {locked && (
        <div className="mb-6 rounded-2xl bg-cran-100 p-4 text-center text-sm font-semibold text-cran-700">
          🔒 The list is locked for the season — no more changes until Christmas!
        </div>
      )}

      {categoriesInOrder.map(({ key, label, icon, blurb }) => {
        const st = stats[key];
        const enabled = key === 'wildcard' ? config.wildcardEnabled : config[key === 'big' ? 'bigBudget' : 'smallBudget'] == null;
        const nudge = spreadNudge(st);
        const catItems = items
          .filter((i) => i.category === key)
          .sort((a, b) => a.position - b.position);

        return (
          <section key={key} className="mb-8">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-pine-900">
                  <span>{icon}</span> {label}
                </h3>
                <p className="text-xs text-ink-soft">{blurb}</p>
              </div>
              {!locked && enabled && (
                <button type="button" className="btn-pine px-3 py-2 text-sm" onClick={() => setModalCat(key)}>
                  + Add
                </button>
              )}
            </div>

            <ProgressBar stats={st} />

            {nudge && locked && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-gold-100 px-3 py-2 text-sm text-pine-900">
                <span className="text-base">💡</span> {nudge}
                <button
                  type="button"
                  className="ml-auto shrink-0 rounded-lg bg-gold-300 px-2.5 py-1 text-xs font-bold hover:bg-gold-200"
                  onClick={() => setModalCat(key)}
                >
                  Add one
                </button>
              </div>
            )}

            <div
              ref={(el) => {
                containerRefs.current[key] = el;
              }}
              onDragOver={(e) => handleDragOver(e, key)}
              onDrop={(e) => handleDrop(e, key)}
              className={`mt-3 rounded-2xl border-2 border-dashed p-2 transition-colors ${
                hover?.category === key ? `${HOVER_CLASSES[key]} bg-pine-50` : 'border-transparent'
              } ${catItems.length === 0 ? 'min-h-[72px]' : ''}`}
            >
              {catItems.length === 0 && locked && enabled && (
                <div className="flex h-[60px] items-center justify-center text-sm text-ink-soft">
                  {key === 'wildcard' ? 'Dream big — add your one special wish ✨' : 'Nothing here yet. Drag items in, or tap Add!'}
                </div>
              )}

              {catItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  draggable={!locked}
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDelete={() => {
                    if (!confirm(`Remove "${item.title}"?`)) return;
                    startTransition(async () => {
                      await deleteItem(item.id);
                      router.refresh();
                    });
                  }}
                  onToggleSurprise={() => {
                    startTransition(async () => {
                      await toggleSurprise(item.id);
                      router.refresh();
                    });
                  }}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Mobile-friendly move menu is inline on each card (see ItemCard) */}

      {modalCat && (
        <AddItemModal
          kidId={kidId}
          category={modalCat}
          wildcardEnabled={config.wildcardEnabled}
          initialUrl={modalCat === 'big' ? initialUrl : null}
          onClose={() => setModalCat(null)}
          onAdded={onAddSuccess}
        />
      )}

      {!locked && (
        <p className="text-center text-xs text-ink-soft">
          Tip: drag items to reorder them, or drop one on another section to move it.
        </p>
      )}
      {pending && <p className="text-center text-sm text-ink-soft">Saving…</p>}
    </div>
  );
}

function ItemCard({
  item,
  draggable,
  onDragStart,
  onDelete,
  onToggleSurprise,
}: {
  item: KidItemDTO;
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDelete: () => void;
  onToggleSurprise: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      data-drag-id={item.id}
      className="group mb-2 flex items-center gap-3 rounded-xl border border-pine-100 bg-white p-3 shadow-card last:mb-0"
    >
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" referrerPolicy="no-referrer" loading="lazy" />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-pine-50 text-2xl">🎁</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-semibold text-pine-900">{item.title}</p>
        <p className="text-sm font-semibold text-cran-600">{item.price != null ? formatMoney(item.price) : 'Price not set'}</p>
        {item.surpriseFlag && (
          <p className="text-[11px] font-semibold text-pine-600">🙈 Hidden from the family share link</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          {item.productUrl && (
            <a href={item.productUrl} target="_blank" rel="noreferrer" className="btn-ghost p-1.5 text-xs" title="Open product page" aria-label="Open product page">
              🔗
            </a>
          )}
          {draggable && (
            <button type="button" className="btn-ghost p-1.5 text-xs cursor-grab active:cursor-grabbing" title="Drag to reorder or move" aria-label="Drag to reorder or move">
              ⠿
            </button>
          )}
          <button type="button" className="btn-ghost p-1.5 text-xs" onClick={() => setMenuOpen((o) => o)} aria-label="More actions">
            ⋯
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute right-3 mt-24 w-44 rounded-xl border border-pine-100 bg-white p-1.5 shadow-lift">
          {draggable && (
            <>
              <MenuItem
                label={item.surpriseFlag ? '👁 Show to family' : '🙈 Hide from family'}
                onClick={() => {
                  setMenuOpen(false);
                  onToggleSurprise();
                }}
              />
              <MenuItem
                label={item.category === 'big' ? 'Move to Small Gifts' : 'Move to Big Gifts'}
                onClick={() => {
                  setMenuOpen(false);
                  const target = item.category === 'big' ? 'small' : 'big';
                  void (async () => {
                    const res = await moveItem(item.id, target as Category, 999);
                    if (!res.ok) window.alert(res.error ?? 'Couldn\u2019t move that.');
                    window.location.reload();
                  })();
                }}
              />
              {item.category == 'wildcard' && (
                <MenuItem
                  label="Move to One Special Wish ✨"
                  onClick={() => {
                    setMenuOpen(false);
                    void (async () => {
                      const res = await moveItem(item.id, 'wildcard', 999);
                      if (!res.ok) window.alert(res.error ?? 'Couldn\u2019t move that.');
                      window.location.reload();
                    })();
                  }}
                />
              )}
            </>
          )}
          <MenuItem
            label="🗑️ Remove"
            danger
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-pine-50 ${
        danger ? 'text-cran-600 hover:bg-cran-50' : 'text-pine-800'
      }`}
    >
      {label}
    </button>
  );
}
