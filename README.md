# UnReal BS - Business Systems

English-first AI business dashboard for GoHighLevel (GHL) sub-accounts: conversations, contacts, funnels/sites, workflows, social posting, a membership area, a lightweight credit ledger, and embedded AI assistants. Bangla remains available through the in-app language toggle.

## Stack

- Next.js 16 (Turbopack). This version has file-convention changes versus older Next.js versions, including `proxy.ts` instead of `middleware.ts`; read `node_modules/next/dist/docs/` before changing routing or auth-adjacent files.
- React 19, Tailwind CSS 4
- NextAuth v5 with Credentials provider, single admin account, and JWT sessions
- GoHighLevel private integration API in `lib/ghl/*`; no database, GHL is the system of record
- Puter.js-backed AI surfaces where the browser runtime is available

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visitors are redirected to `/login`.

## Environment Variables

See [.env.example](.env.example) for the full list. Summary:

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Yes | The single admin login this app accepts. Login is rejected if either is unset; there is no fallback account. |
| `AUTH_SECRET` | Yes in production | Signs NextAuth session JWTs. Generate with `npx auth secret`. |
| `NEXTAUTH_URL` | Usually no | Only needed if your host cannot infer the canonical URL; `trustHost: true` is set in `auth.ts`. |
| `GHL_PRIVATE_TOKEN` | Yes | GoHighLevel Private Integration token. |
| `GHL_LOCATION_ID` | Yes | The GHL sub-account location this app reads and writes. |

## Scripts

- `npm run dev` - dev server
- `npm run build` - production build
- `npm run start` - run the production build
- `npm run lint` - ESLint

## Architecture Notes

- Route groups: `app/(auth)` contains login; `app/(dashboard)` contains authenticated product routes.
- `proxy.ts` wraps every request in NextAuth `auth()` and redirects unauthenticated requests to `/login`. Treat changes to it as security-sensitive.
- `app/api/ghl/[...path]/route.ts` is the authenticated passthrough to the GHL REST API using server-side `GHL_PRIVATE_TOKEN`; client code must not call GHL directly.
- `lib/ghl/*` holds typed `server-only` wrappers for contacts, conversations, sites/funnels, workflows, and related GHL resources.
- `lib/i18n/*` holds `en` and `bn` dictionaries plus a `LocaleProvider`/`useLocale()` context. English is the default locale; Bangla persists via `localStorage` key `unrealbs-locale`.
- Modules live under `app/(dashboard)/<module>/page.tsx` plus `components/<module>/*Shell.tsx`.

## Known Limitations

- Single hardcoded admin account; no user management or roles.
- No automated test suite exists yet.
- No CI config exists yet; run `npm run lint` and `npm run build` manually before deployment.
- `app/(dashboard)/error.tsx` logs caught errors to the console only; add production error tracking before relying on it for incident response.
- Some legacy modules still include Bangla-specific business examples, but the core shell, login, and dashboard are English-first with a Bangla toggle.

## Deploying

Deploy anywhere Next.js runs. Vercel is the simplest path for `next build` and NextAuth proxy support. Configure all required variables from `.env.example` in the host before first production use; the app can build without them, but auth and GHL-backed pages will fail at runtime if they are missing.
