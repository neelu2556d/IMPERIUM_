# Vitality

**An open-source life dashboard.** A multi-user Next.js app that turns your health, training, nutrition, goals, and finances into one calm, beautiful dashboard — with a wearable-agnostic daily Vitality score, deep workout intelligence, and an AI mentor that can build new dashboard tiles for you.

<p align="center">
  <img src="vitality-dashboard.png" alt="Vitality dashboard" width="720" />
</p>

**Website:** https://ohwisey.github.io/vitality-oss/

## What's inside

- **Vitals** — a daily 0–100 Vitality score computed from wearable data (WHOOP, Oura, Fitbit, or manual entry), with recovery/sleep/strain breakdowns and cross-metric insights.
- **Fitness** — a workout logger with progressive-overload intelligence: split planning, rep-zone guidance, deload detection, session resume.
- **Fuel** — nutrition tracking with macro setup, USDA food search, barcode lookups (Open Food Facts), water tracking, and an AI food-photo analyzer.
- **Goals (Vee)** — natural-language goals, drift detection, and an AI companion that notices patterns across your data.
- **Peak** — a day scheduler that aligns your calendar with your recovery.
- **Finance** — net worth, subscriptions, stock/crypto quotes (Finnhub/CoinGecko), receipt and statement import.
- **Brand** — a creator module: channel stats, comment triage, posting-time analysis (YouTube Data API).
- **Forge / Studio / Arts District** — an in-app tile builder (human- or AI-authored single-file HTML tiles), a curated gallery, and public maker profiles.
- **AI Mentor** — a chat mentor with access to your (and only your) data, powered by the Claude API.
- **Hosted MCP server** — connect Claude (claude.ai, Claude Desktop, Claude Code) directly to your dashboard via the Model Context Protocol, with OAuth. See [`mcp/`](mcp/) for the tile-building toolkit.

Everything is multi-user from the ground up: Supabase Auth + Postgres with row-level security on every table, and optional Stripe-gated tiers.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + React 18 + TypeScript |
| Styling | Vanilla CSS with design tokens (no Tailwind) |
| Database/Auth | Supabase (Postgres + RLS + Auth) |
| Payments | Stripe (optional) |
| AI | Claude API (Anthropic) |
| 3D/Graphics | Three.js (landing hero) |
| Tests | Jest + Testing Library |
| Monitoring | Sentry (optional) |

## Quickstart

```bash
git clone https://github.com/ohwisey/vitality-oss.git
cd vitality-oss
pnpm install

# 1. Create a free Supabase project, then apply the schema:
#    supabase link --project-ref <your-project-ref>
#    supabase db push        (applies supabase/migrations/)

# 2. Configure environment:
cp .env.example .env.local  # fill in Supabase URL + keys (the only hard requirement)

# 3. Run:
pnpm dev                    # http://localhost:3000
```

Sign up at `/signup`, and you have a working dashboard. Every integration beyond Supabase is **optional and degrades gracefully** — features that lack a key simply say they aren't configured.

### Optional integrations

| Feature | What you need |
|---|---|
| AI mentor, food-photo analysis, tile Forge | `ANTHROPIC_API_KEY` |
| WHOOP | Users bring their own WHOOP dev app credentials in-app; you only set the callback URL |
| Oura / Fitbit | One shared OAuth app each (free dev accounts) |
| Nutrition search | Free USDA FoodData Central key |
| Stocks/crypto | Free Finnhub key / CoinGecko |
| Creator stats | YouTube Data API v3 key |
| Payments/tiers | Stripe keys (`scripts/stripe-bootstrap.mjs` sets up products) |
| Claude-to-dashboard MCP | `MCP_ENABLED=true` + JWT secrets (see `.env.example`) |

See [`.env.example`](.env.example) for the full annotated list.

## Tests

```bash
pnpm test
```

## Repo tour

```
app/            Next.js App Router: pages, API routes (all third-party calls are server-side)
  app/          The signed-in dashboard and its modules (vitals, fitness, fuel, goals, ...)
  api/          Route handlers: wearables OAuth, AI endpoints, Stripe webhook, cron, MCP
components/     Shared React components (landing hero, quiz, gems, ...)
lib/            Domain logic: scoring, insights, nutrition, training, tiles, auth
engine/         The tile engine DNA — how single-file HTML tiles are built and linted
mcp/            The MCP tile-building toolkit + docs (its own package)
supabase/       SQL migrations (the entire schema, RLS policies included)
scripts/        Bootstrap and maintenance scripts (Stripe setup, test user reset)
workers/        Cloudflare email-ingest worker for wearable summary emails
public/         Static assets + standalone HTML demos and design previews
```

## Design rules (the short version)

1. Vanilla CSS only, tokens in `app/globals.css` — pure black background, mint accents, Inter.
2. Multi-user always: every query is scoped by RLS to the signed-in user.
3. API keys live server-side only — all third-party calls go through `/app/api/*` route handlers.
4. Tier gating happens on the server, never trusted from the client.

More in [CLAUDE.md](CLAUDE.md) (this repo is built to be pleasant to work on with AI coding agents) and [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). Do whatever you want with it — run it for yourself, host it for friends, fork it into something new.
