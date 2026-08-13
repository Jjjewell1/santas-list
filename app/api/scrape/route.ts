import { NextRequest, NextResponse } from 'next/server';
import { scrapeProductUrl, ScrapeError } from '@/lib/scrape';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';

  if (!rateLimit(`scrape:${ip}`, 12, 60_000)) {
    return NextResponse.json({ error: 'Too many look-ups. Slow down a little!' }, { status: 429 });
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected JSON body.' }, { status: 400 });
  }

  const url = (body.url ?? '').toString().trim();
  if (!url) return NextResponse.json({ error: 'No URL provided.' }, { status: 400 });

  try {
    const result = await scrapeProductUrl(url);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ScrapeError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json({ error: 'Something went wrong reading that page.' }, { status: 500 });
  }
}
