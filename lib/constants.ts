export const AVATAR_CHOICES = ['🎄', '🦖', '🌸', '🐨', '🐬', '🚗', '🦄', '🎅', '🦌', '⛄', '⭐', '🎁', '🐧', '🦁', '🐱', '🐶'];

export const COLOR_CHOICES = ['#0f766e', '#b42336', '#7c3aed', '#0ea5e9', '#d97706', '#db2777', '#4d7c0f', '#1d4ed8', '#c2410c', '#047857'];

/** Helper to determine the shareable base URL from request headers. */
export function getBaseUrl(proto: string | null, host: string | null): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  const p = proto === 'http' ? 'http' : 'https';
  return `${p}://${host ?? 'localhost:3000'}`;
}
