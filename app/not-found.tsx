import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-pine-950 via-pine-900 to-pine-700 px-4 text-center text-white">
      <p className="text-7xl">🦌</p>
      <h1 className="mt-4 font-display text-4xl font-bold">Rudolph took a wrong turn.</h1>
      <p className="mt-2 text-gold-200">That page doesn&rsquo;t exist — maybe it melted in the snow.</p>
      <Link href="/" className="btn-gold mt-8">
        Back to the front yard
      </Link>
    </main>
  );
}
