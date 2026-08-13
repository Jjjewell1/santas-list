import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const ALLOWED = /^https?:\/\//;

/**
 * PWA Web Share Target. Browsers POST the shared URL here as form data
 * (or GET when configured that way). We stash the URL in a short-lived
 * cookie so the kid can pick their profile, enter their PIN, and land on
 * their list with the add-item modal pre-filled and auto-scraping.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const url = String(form?.get('url') ?? '').trim();
  return respond(req, url);
}

export async function GET(req: NextRequest) {
  const url = String(req.nextUrl.searchParams.get('url') ?? '').trim();
  return respond(req, url);
}

function respond(req: NextRequest, rawUrl: string) {
  const url = ALLOWED.test(rawUrl) ? rawUrl : '';
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000';
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? `${proto}://${host}`;
  const res = NextResponse.redirect(new URL('/kid', base), 303);
  res.cookies.set('xmas_pending_add', url, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return res;
}
