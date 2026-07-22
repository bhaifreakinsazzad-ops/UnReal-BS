# UnReal BS — Business System

A Bangla-first business dashboard for GoHighLevel (GHL) sub-accounts: conversations, contacts, funnels/sites, workflows, social posting, a membership area, a lightweight credit ledger, and an embedded AI assistant — all driven live through GHL's private integration API. Built with Next.js (App Router) and a single hardcoded-admin login.

## Stack

- Next.js 16 (Turbopack) — **note:** this version has file-convention changes vs. stock Next.js (e.g. `middleware.ts` → `proxy.ts`). Check `node_modules/next/dist/docs/` before changing routing/auth-adjacent files.
- React 19, Tailwind CSS 4
- NextAuth v5 (Credentials provider, single admin account, JWT sessions)
- GoHighLevel private integration API (`lib/ghl/*`) — no database; GHL is the system of record

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real values, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

## Environment variables

See [.env.example](.env.example) for the full list with descriptions. Summary:

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Yes | The one login this app accepts. Login is rejected if either is unset — there is no default/fallback account. |
| `AUTH_SECRET` | Yes (production) | Signs NextAuth session JWTs. Generate with `npx auth secret`. |
| `NEXTAUTH_URL` | Usually no | Only needed if your host doesn't self-report its URL; `trustHost: true` is set in `auth.ts`. |
| `GHL_PRIVATE_TOKEN` | Yes | GoHighLevel Private Integration token. |
| `GHL_LOCATION_ID` | Yes | The GHL sub-account (location) this app reads/writes. |

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint

## Architecture notes

- Route groups: `app/(auth)` (login, unauthenticated) and `app/(dashboard)` (everything else, gated by `proxy.ts`).
- `proxy.ts` (project root) wraps every request in NextAuth's `auth()` and redirects unauthenticated requests to `/login`. This is the only thing standing between the outside world and the dashboard + the GHL passthrough API — treat changes to it as security-sensitive.
- `app/api/ghl/[...path]/route.ts` is a generic authenticated passthrough to the GHL REST API using the server-side `GHL_PRIVATE_TOKEN`; client code calls it instead of talking to GHL directly, so the token never reaches the browser.
- `lib/ghl/*` holds typed, `server-only` wrappers for specific GHL resources (contacts, conversations, sites/funnels, etc.), used from Server Components/pages.
- `lib/i18n/*` holds the bn/en translation dictionaries and a `LocaleProvider`/`useLocale()` context (`lib/i18n/context.tsx`) for client components that need the active locale. Chrome (`Sidebar`/`TopNav`/`MobileDrawer`) already consumes it; individual page Shells adopt it as they're localized (currently: Sites).
- Modules live under `app/(dashboard)/<module>/page.tsx` + `components/<module>/*Shell.tsx` — dashboard, conversations, contacts, agentic-hq, workflows, social-yo, clan, payments, udhar-khata, app-developer, skills, sites, agent-studio, ai-agents, brand-board, integrations, ask-ai.

## Known limitations / follow-ups

- Single hardcoded admin account (no user management, no roles) — by design for a single-business owner tool, not multi-tenant.
- No automated tests exist yet.
- No CI config exists yet; `npm run build`/`npm run lint` are run manually before deploying.
- `error.tsx` logs caught errors to the console only — wire up a real error-tracking service (Sentry, etc.) before relying on it for production incident response.
- `components/ui/avatar.tsx` intentionally uses a plain `<img>` (not `next/image`) since avatar `src` can be an arbitrary GHL-hosted URL.

## Deploying

This is a standard Next.js app — deploy it anywhere Next.js runs (Vercel is the path of least resistance for `next build`/`next start` + edge middleware). Set all variables from `.env.example` in the host's environment settings before the first deploy; the app will build without them but authentication and all GHL-backed pages will fail at runtime if they're missing.
