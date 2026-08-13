export default function KidAvatar({
  avatar,
  color,
  size = 'md',
  className = '',
}: {
  avatar: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'h-9 w-9 text-xl',
    md: 'h-12 w-12 text-2xl',
    lg: 'h-20 w-20 text-4xl',
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full shadow-card ${sizes[size]} ${className}`}
      style={{ backgroundColor: `${color}22`, border: `2px solid ${color}` }}
      aria-hidden
    >
      {avatar}
    </span>
  );
}
