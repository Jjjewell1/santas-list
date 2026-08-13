import * as cheerio from 'cheerio';
import dns from 'node:dns/promises';
import net from 'node:net';

export interface ScrapeResult {
  title: string;
  imageUrl: string | null;
  price: number | null; // dollars as a number, e.g. 24.99
  url: string;
}

export class ScrapeError extends Error {}

const TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 2_500_000;

function isPrivateIPv4(addr: string): boolean {
  const parts = addr.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  if (parts[0] === 0 || parts[0] === 10 || parts[0] === 127) return true;
  if (parts[0] === 100) return true; // CGNAT
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  return false;
}

/** SSRF guard: refuse internal/loopback hosts. */
async function assertPublicHost(hostname: string): Promise<void> {
  if (!hostname || hostname === 'localhost' || hostname === '::1' || hostname === '[::1]') {
    throw new ScrapeError('That address looks internal — try a real product page.');
  }
  try {
    const records = await dns.lookup(hostname, { all: true });
    for (const { address } of records) {
      if (net.isIPv4(address) && isPrivateIPv4(address)) {
        throw new ScrapeError('That address looks internal — try a real product page.');
      }
    }
  } catch (err) {
    if (err instanceof ScrapeError) throw err;
    throw new ScrapeError('Could not resolve that link.');
  }
}

function extractPrice($: cheerio.CheerioAPI): number | null {
  const metaCandidates: string[] = [];
  $('meta').each((_, el) => {
    const property = $(el).attr('property') ?? $(el).attr('name') ?? $(el).attr('itemprop') ?? '';
    const content = $(el).attr('content') ?? '';
    if (/price/i.test(property) && content) metaCandidates.push(content);
  });
  for (const raw of metaCandidates) {
    const parsed = parsePriceString(raw);
    if (parsed != null) return parsed;
  }

  const domCandidates = [
    '[itemprop="price"]',
    '[data-testid="price"]',
    '[data-price]',
    '.price',
    '.a-price .a-offscreen',
    '.ProductPrice',
    '[class*="price"]',
  ];
  for (const sel of domCandidates) {
    const text = $(sel).first().text().trim();
    const parsed = parsePriceString(text);
    if (parsed != null) return parsed;
  }

  const jsonLd = $('script[type="application/ld+json"]').first().text();
  if (jsonLd) {
    const match = jsonLd.match(/"price"\s*:\s*"?([\d,]+\.?\d*)"?/);
    if (match) {
      const parsed = parsePriceString(match[1]);
      if (parsed != null) return parsed;
    }
  }

  return null;
}

function parsePriceString(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, '');
  const match = cleaned.match(/\d+(?:\.\d{1,2})?/);
  if (!match) return null;
  const value = parseFloat(match[0]);
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) return null;
  return Math.round(value * 100) / 100;
}

function extractTitle($: cheerio.CheerioAPI, fallback: string): string {
  const og = $('meta[property="og:title"]').attr('content');
  if (og && og.trim()) return og.trim().slice(0, 200);
  const tw = $('meta[name="twitter:title"]').attr('content');
  if (tw && tw.trim()) return tw.trim().slice(0, 200);
  const h1 = $('h1').first().text().trim();
  if (h1) return h1.slice(0, 200);
  const title = $('title').first().text().trim();
  if (title) return title.slice(0, 200);
  return fallback.slice(0, 200);
}

function extractImage($: cheerio.CheerioAPI): string | null {
  const og = $('meta[property="og:image"]').attr('content');
  if (og && og.trim()) return og.trim();
  const tw = $('meta[name="twitter:image"]').attr('content');
  if (tw && tw.trim()) return tw.trim();
  const link = $('link[rel="image_src"]').attr('href');
  if (link) return link;
  let best: string | null = null;
  let bestSize = 0;
  $('img').each((_, el) => {
    const src = $(el).attr('src') ?? $(el).attr('data-src') ?? '';
    const w = Number($(el).attr('width') ?? 0);
    const h = Number($(el).attr('height') ?? 0);
    if (w > 0 && h > 0) {
      const size = w * h;
      if (size > bestSize && size >= 200 * 200) {
        bestSize = size;
        best = src;
      }
    }
  });
  return best;
}

/**
 * Fetches a product URL server-side and pulls Open Graph title/image/price.
 * Throws ScrapeError with a human-readable message on failure so the UI can
 * fall back to manual entry.
 */
export async function scrapeProductUrl(rawUrl: string): Promise<ScrapeResult> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new ScrapeError('That link doesn\u2019t look like a web address.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ScrapeError('Only http/https links are supported.');
  }

  await assertPublicHost(url.hostname);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent':
          'Mozilla/5.0 (compatible; SantaList/1.0; +https://jewellcore.com)',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en-US,en;q=0.9',
      },
    });
  } catch {
    throw new ScrapeError('Could not reach that site right now.');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 403 || res.status === 429 || res.status === 401) {
    throw new ScrapeError('That site blocked automatic lookups.');
  }
  if (!res.ok) throw new ScrapeError('That site returned an error.');

  const body = (await res.text()).slice(0, MAX_BODY_BYTES);
  const $ = cheerio.load(body);

  const title = extractTitle($, url.hostname);
  const price = extractPrice($);
  const imageUrl = extractImage($);

  if (!title) throw new ScrapeError('Couldn\u2019t find a title on that page.');

  return { title, imageUrl, price, url: url.toString() };
}
