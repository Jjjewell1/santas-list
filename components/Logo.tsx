export default function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`animate-wiggle inline-block ${small ? 'text-2xl' : 'text-3xl'}`} aria-hidden>
        🎄
      </span>
      <span
        className={`font-display font-bold tracking-tight text-pine-900 ${
          small ? 'text-lg' : 'text-2xl'
        }`}
      >
        Santa&rsquo;s List
      </span>
    </span>
  );
}
