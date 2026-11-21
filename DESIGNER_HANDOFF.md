# UnReal Systems — Frontend Designer Handoff

Welcome. This app is being handed to you to make **1000x more interactive and dynamically modern** — visual design, motion, layout, micro-interactions. This document tells you what you need to know before you start, what's safe to change, and what to leave alone.

Read this fully before touching code. It's the difference between a smooth handoff and something breaking in production for real Bangladeshi business owners using this daily.

---

## 1. What this is

**UnReal Systems** ("SaaS IT Agency") — a branded agency operating system for Bangladeshi operators, built on top of GoHighLevel (GHL), Supabase, AI providers, and Vercel. It handles leads, client delivery workflows, service packages, customer credit tracking (Udhar Khata), AI assistants, wallet operations, virtual card reselling, and digital product commerce. Bilingual: English and Bangla, toggled live.

Deployed at **unreal-bs.shop** (Vercel + Supabase + GoHighLevel). You will not have production credentials — see §5.

---

## 2. Tech stack

- **Next.js 16** (App Router, Turbopack) — ⚠️ **this version has real breaking changes from what you might expect from older Next.js knowledge.** Before touching routing, layouts, or config, read `AGENTS.md` in the repo root — it points at `node_modules/next/dist/docs/` for anything unfamiliar.
- **React 19**, **TypeScript**, **Tailwind CSS v4**
- **lucide-react** — icon set used everywhere, stay consistent with it
- **Framer Motion** — already a dependency, barely used yet. This is your best tool for the "more interactive/dynamic" ask — animated transitions, page enters, hover states, etc.
- **Recharts** — used for the Control Room performance chart
- No component library (no shadcn/MUI/etc.) — everything is hand-built in `components/ui/*`

---

## 3. Brand — colors & fonts (already deliberate, not accidental)

- Primary purple: `#7C3AED` (hover `#6D28D9`)
- Accent green: `#00C875`
- Dark navy (headers/heroes): `#07101F`
- Gold accent: `#D8B86A`

Fonts are configured in `app/layout.tsx`: **Inter** (Latin), **Hind Siliguri** (Bangla sans, weights 300–700), **Noto Serif Bengali**, **JetBrains Mono**. This was checked and confirmed correct this session — if you want a different typographic feel, that's a real design decision to make deliberately, not a bug to "fix."

---

## 4. ⚠️ CRITICAL: this app is bilingual — do not break it

Every page can toggle between English and Bangla live (top nav). The pattern used everywhere:

```tsx
import { useLocale } from '@/lib/i18n/context'

const locale = useLocale()
const isBn = locale === 'bn'

// then, inline, everywhere text appears:
{isBn ? 'বাংলা টেক্সট' : 'English text'}
```

**This session, several pages were found completely broken** — some permanently English, some permanently Bangla, ignoring the toggle entirely. All were just fixed. **When you redesign a component, every string must keep both language branches.** Don't hardcode English (or Bangla) text and drop the other — that's the exact bug that was just cleaned up. See `components/contacts/ContactsShell.tsx` for the cleanest reference example of this pattern.

---

## 5. What's REAL vs COMING SOON — know this before you redesign anything

Business owners actually log into this and manage real money. Some pages are fully live and wired to a database; some are honest placeholders; a couple still have leftover demo data. **Redesigning a placeholder to *look* fully functional would be actively misleading — please don't.**

| Page | Status | Notes |
|---|---|---|
| Control Room (`/`) | **Real** | Live GHL + wallet + Udhar Khata numbers |
| Wallet (`/payments`) | **Real** | Real deposits, real balance, real transaction history |
| Udhar Khata (`/udhar-khata`) | **Real** | Real debt-ledger, persisted to database |
| AI Subscriptions (`/ai-subscriptions`) | **Real** | Real metered AI chat, real billing |
| Virtual Cards (`/virtual-cards`) | **Real** | Real card inventory, encrypted credentials |
| Contacts, Conversations, Sites | **Real** | Live GHL data |
| Opportunities (`/opportunities`) | **Coming Soon** | Honest placeholder, waitlist form, not live yet |
| Credit Center (`/credit-center`) | **Coming Soon** | Honest placeholder — real feature coming, powered by a partner |
| MeetAlly (`/meetally`) | **Coming Soon** | Placeholder — owner's own platform not live yet |
| Social Market (`/social-market`) | **Partially demo** | Mock post history is fake; only Facebook/Instagram have any real backend |
| Integrations (`/integrations`) | **Catalog only** | Real external links, but no in-app OAuth/connection yet |

The three "Coming Soon" pages share one component: `components/shared/ComingSoonShell.tsx`. Feel free to make it beautiful and interactive — just keep it honest about being "coming soon," don't remove that framing.

---

## 6. File structure map

```
app/(dashboard)/<feature>/page.tsx     — one route per feature, usually a thin wrapper
components/<feature>/<Feature>Shell.tsx — the actual page component, this is what you'll redesign
components/ui/*                         — shared primitives: Card, Button, Badge, Input, Textarea
components/shell/*                      — global chrome: Sidebar, TopNav, MobileBottomNav, MobileDrawer
components/wallet/*, components/shared/* — small reusable pieces (WalletBalanceChip, ComingSoonShell, etc.)
lib/*                                   — business logic, API clients, DB access
app/api/*                               — backend routes
supabase/migrations/*                   — database schema (never touch)
```

---

## 7. What you should / shouldn't touch

**✅ Freely redesign:**
- JSX structure, Tailwind classes, spacing, layout, visual hierarchy
- Animations, transitions, micro-interactions (Framer Motion is your friend)
- Empty states, loading states, error states — make them feel alive
- `components/ui/*` primitives — but see the caution below

**⚠️ Touch carefully:**
- `components/ui/*` — these are used across the *entire app*. A change here ripples everywhere. Good for a cohesive visual refresh, but test broadly.
- `components/shell/*` (nav/sidebar) — same reason, plus it drives navigation logic, not just visuals.

**🚫 Don't touch:**
- Anything in `app/api/*` — these are backend routes, not UI.
- `lib/*` (except pure formatting helpers you can identify by inspection) — business logic, database access, GHL/Supabase clients.
- `useState`/`useEffect` data-fetching logic inside Shell components — the `fetch('/api/...')` calls and what they do with the response. **Restructure what's rendered, not how data gets there.**
- `auth.ts`, `supabase/migrations/*`, anything with `server-only` at the top of the file.
- Environment variables / secrets.

**If a redesign genuinely needs different data** (a new field, a different shape, a new endpoint) — flag it instead of inventing fake data to make something "work." Fake data in a real money app is exactly what was just cleaned up this session — please don't reintroduce it.

---

## 8. Local setup

```bash
npm install
cp .env.example .env.local
```

Open `.env.local` and set at minimum:
```
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=anything-you-want
AUTH_SECRET=   # generate with: npx auth secret
```

Leave everything else blank — the app is built to degrade gracefully without Supabase/GHL/AI provider credentials (you'll see "not configured" states instead of crashes, and pages using seed/demo data will show that instead of live data). That's expected and fine for design work.

```bash
npm run dev
```

Visit `http://localhost:3000`, log in with the `ADMIN_EMAIL`/`ADMIN_PASSWORD` you set.

---

## 9. Before sending anything back

Run all three — they must pass clean, no exceptions:

```bash
npx eslint .
npx tsc --noEmit
npm run build
```

A broken build blocks deployment entirely. If `next build` fails, it doesn't ship.

---

## 10. Git workflow

Please work in a separate branch (e.g. `design/frontend-refresh`) — **do not push directly to `main`**. When you're ready to hand back, let [the project owner] know; they'll loop the engineering side back in for final review, live-data verification, and production deployment. Nobody but the project owner and engineering has production deploy access — that's intentional, not a trust issue with you.

---

## 11. Good reference components (clean patterns to copy from)

- `components/contacts/ContactsShell.tsx` — cleanest bilingual (`isBn`) pattern
- `components/wallet/WalletBalanceChip.tsx`, `components/wallet/DepositRequestCard.tsx` — small, well-scoped, recently built
- `components/ai-subscriptions/AISubscriptionsShell.tsx` — a full modern shell with real async state, chat UI, model picker
- `components/shared/ComingSoonShell.tsx` — the shared "coming soon" pattern, parameterized

---

## 12. Who owns what

- **You (design):** visual and interactive layer — everything the user sees and feels.
- **Engineering (Claude/backend):** final review, live-data verification, Supabase/Vercel deployment, merging into production.
- **[Project owner]:** coordinates the handoff both directions.

When your pass is done, it comes back through engineering for testing against real data before anything goes live — that's the normal flow, not a sign something's wrong with your work.

Good luck — make it beautiful.
