# Santa's List

Self-hosted family Christmas wish-list app. A parent dashboard plus a kid portal
with budget limits, URL scraping, share links for relatives, a 12 Days board,
countdown, and PWA "share to list" support.

## Features

- **Kid portal** — each kid gets a 4-digit PIN, their own list, drag-to-move
  items, and a confetti moment when they hit a spending milestone.
- **Budget rules** — Big (max 3), Small (max 5), Wildcard (max 1, uncapped).
  Optional soft ceiling (default 60%) with green / amber / red progress bands.
- **URL scraping** — add an item by pasting a link; title/image are fetched from
  the page's OpenGraph tags (rate-limited, SSRF-guarded).
- **Share links** — revocable magic links (per-kid and whole-family) so relatives
  can view lists and claim items ("Grandma will buy this!") without an account.
- **Surprise mode** — items can be marked as surprises; they are hidden from the
  kid's own list and from share views (kept in "the vault").
- **12 Days board & countdown** — festive homepage that kids and parents both see.
- **PWA** — installable, with a Web Share Target so kids can share a product link
  straight into their list from any phone browser.

## Tech

- Next.js 15 (App Router) + React 19 + TypeScript
- Prisma 6 + SQLite (single-file DB, easy backup)
- Tailwind CSS v4
- Custom auth: scrypt-hashed parent password + per-kid PIN, JWT sessions (jose)
- Docker (multi-stage, non-root) / Coolify / Cloudflare Tunnel

## Local development

```bash
npm install
# copy .env.example to .env and set SESSION_SECRET (openssl rand -base64 32)
npm run dev
```

- Open `http://localhost:3000` — the first visit to `/login` bootstraps the
  parent admin account (shown only while no admin exists).
- `npm run build` + `npx tsc --noEmit` should be clean.
- The SQLite file lives at `prisma/data/christmas.db` (relative Prisma paths are
  resolved from the schema directory).

### Seeding

```bash
npx prisma migrate deploy   # apply migrations to a fresh DB
node prisma/seed.mjs        # idempotent: 2026 year + 6 placeholder kids
```

## Docker

```bash
# optional: prefill env
cp .env.example .env

docker compose up -d --build
```

- DB and migrated/seed are handled automatically on container start.
- The database is stored in a Docker volume at `/app/data` (SQLite file
  `christmas.db`) — **back this up**; it is the entire app's data.
- Runtime env vars: `DATABASE_URL` (defaults to
  `file:/app/data/christmas.db` inside the container), `SESSION_SECRET`,
  `NEXT_PUBLIC_BASE_URL`, `TZ`.

### Building yourself

```bash
docker build -t santas-list .
docker run -d -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  -e SESSION_SECRET="$(openssl rand -base64 32)" \
  -e NEXT_PUBLIC_BASE_URL="https://christmas.yourdomain.com" \
  --restart unless-stopped santas-list
```

## Deploying (Coolify + Cloudflare)

1. Point the app's public URL at `christmas.<yourdomain>.com`.
2. Set `SESSION_SECRET` (required) and `NEXT_PUBLIC_BASE_URL`.
3. Create a persistent volume mounted at `/app/data` so the SQLite file survives
   redeploys.
4. **Security note:** this app intentionally uses short, guessable kid PINs and
   no brute-force throttling. Do not expose it directly to the internet — put it
   behind the Cloudflare Tunnel so only your family reaches it.
5. First visit to `/login` creates the parent account — do that before sharing
   any links.

## PWA / iOS notes

- "Add to Home Screen" works on iOS 16.4+; on iOS the Web Share Target appears
  in the share sheet when the installed app is running Safari share.
- If icons look stale, regenerate with `node scripts/generate-icons.mjs`.

## Project layout

```
prisma/schema.prisma       data model
prisma/seed.mjs            idempotent seed
lib/                       prisma client, auth, session, budget, scrape, guards
app/actions/               server actions (auth, admin, items, share)
app/admin/                 parent dashboard
app/kid/                   kid portal
app/share/                 relative share links
app/api/                   scrape + health endpoints
components/                UI (KidListApp, AddItemModal, ShareLinkBlock, ...)
scripts/                   icon generation, smoke tests
public/                    PWA assets + service worker
```
