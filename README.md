# UnReal BS — Business Systems

UnReal BS is a production Next.js business portal for Bangladeshi businesses. It combines a public eligibility funnel, GoHighLevel-backed CRM workflows, account-scoped business tools, AI services, virtual-card operations, advertising operations, and feature-gated platform commerce.

## Public and protected routes

Public conversion routes:

- `/unreal-bs` — primary campaign journey
- `/apply` — Turnstile-protected eligibility application
- `/privacy` and `/terms` — public policies

Protected product routes include the dashboard, opportunities, credit center, conversations, contacts, workflows, sites, AI tools, payments, and operator administration.

Platform storefront routes (`/p`, `/shop`, `/checkout`, and `/learn`) return `404` until their server-controlled flags are deliberately enabled.

## Platform commerce

The launch model is platform-owned products only. Ordinary workspace users cannot publish products or request payouts. Marketplace tables remain dormant for a future release, but launch sales record the full price as platform revenue and zero seller payout.

Supported product kinds are courses, private downloads, services, and consultations. A buyer transfers to a validated platform bKash, Nagad, or Rocket number and submits a transaction reference. Paid orders remain in `verification_submitted` until an operator re-enters their password and confirms the transfer. Free products receive immediate paid access.

Confirmation, rejection, refund, product publication, card reveal, and card assignment are protected with centralized authorization, throttling, audit records, expected-state checks, and idempotency where money or inventory changes. Buyer access tokens are shown once; only SHA-256 hashes are stored. Private files use short-lived signed download URLs and a strict upload allowlist.

## Marketing measurement

Meta Pixel does not load until the visitor grants marketing consent. Browser and Conversions API events share event IDs for deduplication. `Purchase` is emitted only after operator-confirmed payment. The server hashes normalized email and phone values and never exposes the CAPI token to browser code. Consent can be withdrawn from the persistent privacy control.

## Stack

- Node.js 24.18.x and npm 11.16.0
- Next.js 16.3.0, React 19, and Tailwind CSS 4
- NextAuth v5 Credentials sessions with an eight-hour absolute lifetime
- Supabase/Postgres with RLS, additive migrations, audit records, and server-only service-role access
- GoHighLevel private integration APIs
- Vitest and Playwright release gates
- Vercel production hosting

Next.js 16 uses `proxy.ts` rather than `middleware.ts`. Read the installed framework guides in `node_modules/next/dist/docs/` before changing routing, cookies, CSP, or authentication boundaries.

## Local setup

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Protected routes redirect unauthenticated users to `/login`.

## Commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

## Important environment variables

See `.env.example` for the complete list. Secrets must remain server-only.

| Group | Variables |
|---|---|
| Authentication | `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| Supabase | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| GoHighLevel | `GHL_PRIVATE_TOKEN`, `GHL_LOCATION_ID` |
| Commerce flags | `COMMERCE_ENABLED`, `STORE_PUBLIC_ENABLED`, `MARKETPLACE_SELLERS_ENABLED`, `COMMERCE_CANARY_EMAILS` |
| Payment destinations | `PLATFORM_BKASH_NUMBER`, `PLATFORM_NAGAD_NUMBER`, `PLATFORM_ROCKET_NUMBER` |
| Meta | `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_GRAPH_API_VERSION`, `META_CONSENT_VERSION` |
| Turnstile | `TURNSTILE_ENABLED`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| CSP | `CSP_ENFORCE` |

## Release policy

Production releases use `npm ci`, green CI, preview review, and the manual exact-SHA deployment workflow. Commerce stays dark until production backup and reconciliation evidence exists. Database changes are additive and are never destructively reversed; rollback uses flags and Vercel rollback first, followed by a forward database fix if required.

Read `PRE_AD_LAUNCH_RUNBOOK.md`, `IMPLEMENTATION_STATUS.md`, `QA_REPORT.md`, and `ARCHITECTURE.md` before enabling commerce or advertising.

## Known launch boundaries

- MFA is deferred; ten-minute password re-verification protects sensitive actions.
- Marketplace sellers and payouts must remain disabled for this launch.
- A validated payment destination, production migration, controlled payment/refund canary, Meta Test Events proof, completed external security scan, and 24-hour soak are required before advertising.
- Missing business credentials block feature activation, not local builds.
