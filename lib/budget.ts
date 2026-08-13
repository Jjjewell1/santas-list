export type Category = 'big' | 'small' | 'wildcard';

export interface CategoryMeta {
  label: string;
  plural: string;
  maxItems: number;
  icon: string;
  blurb: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  big: {
    label: 'Big Gifts',
    plural: 'Big Gift ideas',
    maxItems: 3,
    icon: '🎁',
    blurb: 'Up to 3 big wishes — stay within the budget.',
  },
  small: {
    label: 'Small Gifts',
    plural: 'Small Gift ideas',
    maxItems: 5,
    icon: '🧦',
    blurb: 'Up to 5 stocking stuffers — stay within the budget.',
  },
  wildcard: {
    label: 'One Special Wish',
    plural: 'Special Wishes',
    maxItems: 1,
    icon: '🌟',
    blurb: 'No price limit — this one is all yours.',
  },
};

export const CATEGORIES: Category[] = ['big', 'small', 'wildcard'];

export interface BudgetKid {
  bigBudget: number | null;
  smallBudget: number | null;
  wildcardEnabled: boolean;
  softCeilingEnabled: boolean;
  softCeilingPct: number;
}

export interface ItemLike {
  id: number;
  category: string;
  price: number | null;
}

export type StatColor = 'green' | 'amber' | 'red' | 'gray';

export interface CategoryStats {
  category: Category;
  budget: number | null;
  configured: boolean;
  total: number;
  count: number;
  maxItems: number;
  percent: number | null;
  color: StatColor;
  overBudget: boolean;
}

/** Returns the money budget for a category. Wildcards never have one. */
export function categoryBudget(kid: BudgetKid, category: Category): number | null {
  if (category === 'big') return kid.bigBudget;
  if (category === 'small') return kid.smallBudget;
  return null;
}

/** Whether the category is turned on for this kid right now. */
export function isCategoryEnabled(kid: BudgetKid, category: Category): boolean {
  if (category === 'wildcard') return kid.wildcardEnabled;
  return categoryBudget(kid, category) !== null;
}

export function computeStats(kid: BudgetKid, items: ItemLike[], category: Category): CategoryStats {
  const budget = categoryBudget(kid, category);
  const configured = category === 'wildcard' ? kid.wildcardEnabled : budget !== null;
  const catItems = items.filter((i) => i.category === category);
  const total = catItems.reduce((sum, i) => sum + (i.price ?? 0), 0);
  const count = catItems.length;
  const maxItems = CATEGORY_META[category].maxItems;

  let color: StatColor = 'gray';
  let percent: number | null = null;
  if (configured && category === 'wildcard') {
    color = 'green';
  } else if (configured && budget) {
    percent = (total / budget) * 100;
    color = percent >= 95 ? 'red' : percent >= 70 ? 'amber' : 'green';
  }

  return {
    category,
    budget,
    configured,
    total,
    count,
    maxItems,
    percent,
    color,
    overBudget: configured && category !== 'wildcard' && total > (budget ?? 0),
  };
}

export type AddCheck =
  | { ok: true }
  | {
      ok: false;
      reason: 'disabled' | 'max-items' | 'over-budget' | 'over-ceiling';
      budgetUsed?: number;
      budget?: number;
      ceiling?: number;
    };

/**
 * Validates adding a new item to a category. Rejects when a category is
 * disabled, at its item limit, over budget, or over the soft ceiling.
 */
export function checkAdd(
  kid: BudgetKid,
  items: ItemLike[],
  category: Category,
  priceCents: number | null
): AddCheck {
  const meta = CATEGORY_META[category];
  const catItems = items.filter((i) => i.category === category);

  if (!isCategoryEnabled(kid, category)) return { ok: false, reason: 'disabled' };
  if (catItems.length >= meta.maxItems) return { ok: false, reason: 'max-items' };

  // The wildcard is uncapped — nothing else to check.
  if (category === 'wildcard') return { ok: true };

  const budget = categoryBudget(kid, category) ?? 0;
  if (priceCents == null) return { ok: true };

  const total = catItems.reduce((sum, i) => sum + (i.price ?? 0), 0);
  if (total + priceCents > budget) {
    return { ok: false, reason: 'over-budget', budgetUsed: total, budget };
  }

  if (kid.softCeilingEnabled) {
    const ceiling = Math.round((budget * kid.softCeilingPct) / 100);
    if (priceCents > ceiling) return { ok: false, reason: 'over-ceiling', ceiling };
  }

  return { ok: true };
}

/** Friendly "spread it out" nudge when budget and slots both remain. */
export function spreadNudge(stats: CategoryStats): string | null {
  if (stats.category === 'wildcard') return null;
  if (!stats.configured) return null;
  const remainingSlots = stats.maxItems - stats.count;
  const remainingBudget = (stats.budget ?? 0) - stats.total;
  if (remainingSlots <= 0 || remainingBudget <= 0) return null;
  return `You've still got ${formatMoney(remainingBudget)} and ${remainingSlots} more ${
    stats.category === 'big' ? 'Big Gift ideas' : 'Small Gift ideas'
  } left — want to add another?`;
}

/** Formats a cent amount as "$12.99". */
export function formatMoney(cents: number | null | undefined): string {
  if (cents == null) return '';
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Parses a "$12.99" style user input into cents. Returns null on garbage. */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.trim().replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}
