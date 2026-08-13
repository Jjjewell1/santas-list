import { formatMoney, type CategoryStats } from '@/lib/budget';

const BAR_COLORS: Record<CategoryStats['color'], string> = {
  green: 'bg-gradient-to-r from-pine-600 to-pine-400',
  amber: 'bg-gradient-to-r from-gold-500 to-gold-300',
  red: 'bg-gradient-to-r from-cran-600 to-cran-400',
  gray: 'bg-pine-100',
};

const PILL: Record<CategoryStats['color'], string> = {
  green: 'bg-pine-100 text-pine-800',
  amber: 'bg-gold-100 text-gold-500',
  red: 'bg-cran-100 text-cran-600',
  gray: 'bg-gray-100 text-gray-500',
};

const DOT: Record<CategoryStats['color'], string> = {
  green: 'bg-pine-500',
  amber: 'bg-gold-400',
  red: 'bg-cran-500',
  gray: 'bg-gray-300',
};

export default function ProgressBar({ stats }: { stats: CategoryStats }) {
  const pct = Math.min(100, Math.round(stats.percent ?? 0));
  const width = stats.configured ? `${pct}%` : '0%';

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs font-display font-semibold text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${DOT[stats.color]}`} aria-hidden />
          {stats.configured ? (
            <>
              {formatMoney(stats.total)} / {formatMoney(stats.budget)} used
            </>
          ) : stats.category === 'wildcard' ? (
            'No price limit'
          ) : (
            'No budget set yet'
          )}
        </span>
        <span className={`rounded-full px-2 py-0.5 ${PILL[stats.color]}`}>
          {stats.count}/{stats.maxItems} picked
        </span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-pine-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[stats.color]}`}
          style={{ width }}
        />
      </div>
    </div>
  );
}
