# UnReal BS - Business Systems

English-first AI business dashboard for GoHighLevel (GHL) sub-accounts: conversations, contacts, funnels/sites, workflows, social posting, a membership area, a lightweight credit ledger, and embedded AI assistants. Bangla remains available through the in-app language toggle.

## UNREAL BS Founding Pilot

This release is a founding-client pilot for **UNREAL BS - Lead-Ready Business Portal + Opportunity Credit**. It is designed to support ads, eligibility capture, a product demo, and manual onboarding for the first founding clients.

Public routes:

- `/unreal-bs` - campaign landing page
- `/apply` - eligibility application

Protected product routes:

- `/` - Control Room
- `/opportunities` - Hoooplaaa Opportunity Feed
- `/credit-center` - Opportunity Credit Center
- `/services` - NRE Service Marketplace
- `/conversations` - Inbox
- `/contacts` - Customers
- `/workflows` - Sales Pipeline
- `/sites` - Sites & Funnels

This release is intentionally not a full multi-tenant SaaS. Full role management, automated opportunity marketplace, automated billing provider integration, database-backed audit logs, and automated weekly invoices are Phase 2.

## Digital Products & Courses

Sellers build and sell digital products — online courses, downloadable files,
fixed-price services and paid consultations — from `/products`. One engine
serves all four; `kind` is the only thing that differs, so checkout,
commission, refunds and the buyer's access page are written once.

Public storefront routes (no account required):

- `/p/<slug>` — a product page, server-rendered so Facebook and WhatsApp build
  a real link preview
- `/shop/<handle>` — everything one seller has published, for a page bio
- `/checkout/<accessToken>` — payment instructions and the TrxID form
- `/learn/<accessToken>` — the course player and download links

**Money.** The buyer pays the platform's bKash/Nagad number, an operator
matches the TrxID in `/admin/orders`, and confirming credits the seller's
wallet with the sale minus a 10% commission (floor ৳10, cap ৳2,000, minimum
paid price ৳50; free products are supported and take no commission). The split
is computed in `lib/commerce/pricing.ts`, which the seller's editor and the
checkout route both import, and `unreal_bs_orders` carries a CHECK constraint
asserting `commission + payout = price` on every row. Sellers withdraw through
`/sales`; the wallet is debited when the request is made, not when it is paid,
so the balance cannot be spent twice.

**Payments are manual today.** There is no gateway — SSLCommerz and aamarPay
both need a trade licence, a company bank account and a paid setup before the
first taka moves. `lib/commerce/payment-provider.ts` defines the interface one
will implement, `orders` already carries `gateway_provider`/`gateway_ref`, and
the checkout page branches on `isGatewayConfigured()` so it tells the buyer the
truth about how they are paying.

**Video is embedded, not hosted.** Only YouTube and Vimeo links are accepted,
and they are parsed rather than trusted — the URL ends up in an `<iframe src>`.
See `lib/commerce/video.ts`.

**Downloads** live in a private Supabase Storage bucket (`product-files`).
Every download re-checks that the order is paid and then issues a 60-second
signed URL; the storage path never leaves the server.

**What GoHighLevel does here.** GHL's public API *cannot create courses* — its
Memberships API is a single bulk-import endpoint with no CRUD, so a course
built through it could never be edited or deleted afterwards. The course engine
is therefore ours. GHL is used for the part its API does well: on every paid
order the buyer is upserted as a contact in the *seller's own* sub-account and
tagged (`unrealbs-buyer`, `kind-<kind>`, `bought-<product>`), so the seller's
existing follow-up workflows fire. This never blocks a sale — a seller with no
connected workspace sells exactly the same.

Operator screens: `/admin/orders`, `/admin/products` (take-down, not approval —
products publish without review), `/admin/payouts`.

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
| `NEXT_PUBLIC_UNREAL_BS_PUBLIC_URL` | No | Public campaign route, defaults to `/unreal-bs`. |
| `HOOOPLAAA_OPPORTUNITY_SOURCE` | No | MVP opportunity source. Use `seed` for founding-pilot demo mode. |
| `HOOOPLAAA_STARTER_CREDIT_LIMIT` | No | Starter opportunity-credit limit, defaults to `5000`. |
| `UNREAL_BS_FOUNDING_ACTIVATION_BDT` | No | Founding activation price, defaults to `4999`. |
| `UNREAL_BS_MONTHLY_MEMBERSHIP_BDT` | No | Founding monthly membership price, defaults to `6999`. |

## Scripts

- `npm run dev` - dev server
- `npm run build` - production build
- `npm run start` - run the production build
- `npm run lint` - ESLint

## Architecture Notes

- Route groups: `app/(auth)` contains login; `app/(dashboard)` contains authenticated product routes.
- `proxy.ts` wraps every request in NextAuth `auth()` and redirects unauthenticated requests to `/login`. Treat changes to it as security-sensitive.
- `app/api/ghl/[...path]/route.ts` is the authenticated passthrough to the GHL REST API using server-side `GHL_PRIVATE_TOKEN`; client code must not call GHL directly.
- `app/api/ghl/[...path]/route.ts` is allowlisted for the product routes this MVP uses; random passthrough paths should return `403`.
- `app/api/applications/route.ts` is the public eligibility capture endpoint. It validates form data, upserts the GHL contact, and applies additive applicant tags.
- `lib/ghl/*` holds typed `server-only` wrappers for contacts, conversations, sites/funnels, workflows, and related GHL resources.
- `lib/unreal/*` holds founding-pilot seed data for demo opportunities and starter service packs.
- `lib/i18n/*` holds `en` and `bn` dictionaries plus a `LocaleProvider`/`useLocale()` context. English is the default locale; Bangla persists via `localStorage` key `unrealbs-locale`.
- Modules live under `app/(dashboard)/<module>/page.tsx` plus `components/<module>/*Shell.tsx`.

## Known Limitations

- Single hardcoded admin account; no user management or roles.
- No automated test suite exists yet.
- No CI config exists yet; run `npm run lint` and `npm run build` manually before deployment.
- `app/(dashboard)/error.tsx` logs caught errors to the console only; add production error tracking before relying on it for incident response.
- Some legacy modules still include Bangla-specific business examples, but the core shell, login, and dashboard are English-first with a Bangla toggle.
- Opportunities and Credit Center currently use clearly marked seed/demo state for founding sales calls; live marketplace matching, automated settlement, and audit persistence are Phase 2.

## Deploying

Deploy anywhere Next.js runs. Vercel is the simplest path for `next build` and NextAuth proxy support. Configure all required variables from `.env.example` in the host before first production use; the app can build without them, but auth and GHL-backed pages will fail at runtime if they are missing.
