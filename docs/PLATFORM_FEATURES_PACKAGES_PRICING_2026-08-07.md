# UNREAL BS — Platform, Packages, Pricing, and Installable App Report

Report date: 2026-08-07 (Asia/Dhaka)
Canonical website: `https://www.unreal-bs.shop`
Public account opening: `https://www.unreal-bs.shop/signup`

## 1. Executive summary

UNREAL BS is a bilingual, Bangladesh-focused business operating system built on Next.js, Supabase, GoHighLevel, multiple AI-provider adapters, and Vercel. It combines customer management, conversations, automation, business records, wallet-controlled paid services, AI usage, Meta-ad operations, virtual-card administration, and operator controls in one protected web application.

The platform is now packaged as a Progressive Web App (PWA). A visitor can install it from a supported browser on Android, iPhone/iPad, Windows, macOS, or ChromeOS and launch it from the home screen, Start menu, Dock, or desktop like an application. It remains the same live platform and uses the same account, URLs, database, security boundaries, GoHighLevel connections, and consent-gated Meta Pixel/CAPI implementation.

The installed app intentionally does not cache authenticated pages, API responses, customer records, wallet information, payment data, or Meta requests for offline use. An internet connection is required. This avoids stale business data and prevents sensitive data from being retained by a service-worker cache.

## 2. How users install the application

| Device/browser | Installation path |
|---|---|
| Android Chrome/Edge | Open the site, open the browser menu, choose **Install app** or **Add to Home screen** |
| Windows Chrome/Edge | Open the site, select the install icon in the address bar or choose **Install UnReal BS** from the browser menu |
| macOS Chrome/Edge | Open the site and choose **Install UnReal BS** from the address bar or browser menu |
| iPhone/iPad Safari | Open the site, select **Share**, then **Add to Home Screen** |
| ChromeOS | Open the site and use the address-bar install icon or browser menu |

The PWA manifest uses the existing UNREAL BS identity, gold-on-dark branded icons, standalone display mode, root scope, and the protected application root as its launch destination.

## 3. Platform feature inventory

The current source contains 50 application pages and 54 API route handlers. Route presence alone does not mean every feature is publicly enabled; status is separated below.

### Public acquisition and trust

- Public UNREAL BS product/marketing experience.
- Free account registration and secure credentials login.
- Eligibility/application funnel connected to GoHighLevel where configured.
- Terms, privacy, consent management, and consent withdrawal.
- Meta Pixel `1035455475771760`, loaded only after marketing consent.
- Meta Conversions API support with hashed identifiers and browser/server event-ID deduplication.
- Signup `CompleteRegistration`, application `Lead`, checkout initiation, content view, and confirmed-payment Purchase event boundaries.
- Campaign attribution including bounded UTM values, landing page, referrer, `fbclid`, `_fbc`, and `_fbp`.
- Installable browser application with Android, iOS, Windows, macOS, and ChromeOS support.

### Accounts, permissions, and security

- Public tenant-aware account creation.
- NextAuth credentials/JWT authentication.
- Eight-hour absolute sessions.
- Password re-verification for sensitive operator actions.
- Centralized administrator authorization.
- Same-origin and JSON content-type enforcement for state-changing APIs.
- Request IDs, payload limits, fail-closed rate limiting, and redacted security logging.
- Tenant-aware GoHighLevel location resolution.
- Server-only Supabase service-role, GoHighLevel, provider, payment, and Meta secrets.
- Report-only nonce-based Content Security Policy with a controlled allowlist.

### Control Room and CRM operations

- Main Control Room/dashboard.
- Customer/contact access through GoHighLevel.
- Unified conversation/inbox surface.
- Workflow and sales-pipeline access.
- Sites and funnels inventory.
- Brand/location information.
- GoHighLevel server proxy with authentication and location scoping.
- Agent Studio inventory, execution contract, Voice AI inventory, and analytics where the connected HighLevel account grants those scopes.

### Wallet and money controls

- BDT-denominated prepaid wallet.
- Append-style wallet ledger and balance display.
- Manual bKash, Nagad, or Rocket deposit-request workflow where payment destinations are configured.
- Administrator deposit confirmation.
- Atomic wallet debit/credit database functions.
- Insufficient-balance and duplicate-operation guards.
- Daily AI-spend cap.
- Audit evidence for sensitive money operations.

### Udhar Khata

- Customer debt/credit entries.
- Invoice-level payment attribution.
- Outstanding, paid, and overdue summaries.
- Partial-payment recording.
- Customer balance views.
- Bengali payment-reminder preparation.

### AI system

- Multi-provider AI adapter architecture.
- OpenAI, Anthropic, Google, OpenRouter, Cerebras, Hugging Face, Cohere, and other configured-provider capability detection.
- Admin-editable model rate card.
- Metered input/output token charging in BDT.
- Usage fallback estimation when a provider omits token usage.
- Prepaid AI bundles with wallet-credit bonuses.
- Cheapest-model free daily allowance.
- Per-user daily-spend protection.
- BhaiFreakin AI business-support interface.
- AI-assisted advertising copy generation.
- AI Agents, Agent Studio, and provider-capability surfaces; actual availability depends on configured credentials and HighLevel permissions.

### Meta advertising operations

- Customer campaign intake for traffic, lead, message, and sales objectives.
- Budget and duration validation.
- Managed-campaign service-fee calculation.
- Wallet fee debit with automatic refund when operator fulfillment fails or is rejected.
- Administrator campaign queue and status handling.
- Meta Pixel and Conversions API measurement.
- Direct Meta Marketing API publishing remains gated until the required Meta business/app/OAuth permissions are approved.

### Virtual cards

- User virtual-card request workflow.
- Administrator request queue and assignment.
- Atomic wallet charging with automatic refund protection on failed assignment.
- Encrypted credential storage.
- Step-up-protected credential reveal.
- Operator-defined final BDT charge because card/provider cost is not a fixed public package.

### Services and business operations

- Starter service catalog covering lead recovery, advertising conversion, reactivation, appointments, reviews, branding, AI assistance, sales-team control, customer portals, and business audits.
- Manual service-scope confirmation before activation.
- Support/Ask AI surface.
- Integrations catalog/launchpad.
- App Developer, Brand Board, Skills, Social Market, Agentic HQ, Clan, and related product surfaces.

### Platform-owned digital commerce

- One product model for courses, downloads, services, and consultations.
- Platform-owned product administration.
- Product publication/rejection controls.
- Public product/store, checkout, learning, signed download, and buyer-access code paths.
- Free-product immediate access and manual transfer confirmation for paid products.
- Access-token hashing, payment-reference uniqueness, idempotent confirmation, refund evidence, and audit metadata.
- GoHighLevel buyer synchronization.

Current release status: public store and commerce flags remain off unless explicitly enabled by the operator. Ordinary users cannot become marketplace sellers or request payouts. This prevents dormant marketplace behavior from being presented as an active public offer.

### Administration and observability

- Admin hub.
- User administration.
- AI rate-card and bundle administration.
- Deposit, virtual-card, ad-campaign, product, order, payout, and Meta-dataset queues.
- Meta dataset Test Events validation.
- Live and readiness health endpoints.
- Capability-only readiness reporting without secret/customer disclosure.
- Structured audit and error logging.
- Vercel deployment/runtime observability and GitHub Actions CI.

### Intentionally limited or coming-soon areas

- Opportunities and Credit Center are coming-soon surfaces, not active lending or underwriting products.
- MeetAlly is not an active marketplace.
- Social Market is not a fully connected social publishing system.
- Integrations is not a complete customer OAuth connection manager.
- “400 Services” currently exposes a smaller operational starter catalog; it is not evidence that all 400 services are fulfilled automatically.
- HighLevel/Agent Studio write capabilities depend on the connected account's granted scopes.

## 4. Customer-facing packages and pricing

All amounts below are BDT unless explicitly stated otherwise. These are the values encoded in the current source/migrations. AI bundle and model prices are administrator-editable in the database, so the signed-in purchase screen remains the final operational quotation if an operator changes them.

### Founding Membership

| Item | Price | Billing treatment |
|---|---:|---|
| Activation | ৳4,999 | One-time activation |
| Membership | ৳6,999 | Monthly |
| AI packages | From ৳699 | Prepaid wallet-credit packages |
| Udhar Khata and Wallet | Included | Included with the account/membership offer |

### AI prepaid packages

| Package | Customer pays | Wallet AI credit | Encoded maximum provider-cost ceiling |
|---|---:|---:|---:|
| Starter | ৳699 | ৳720 | ৳496.55 |
| Growth | ৳999 | ৳1,150 | ৳793.10 |
| Pro | ৳1,999 | ৳2,600 | ৳1,793.10 |

Additional AI billing rules:

- Default free allowance: 10 cheapest-model messages per day.
- Default paid-usage safety cap: ৳500 per day per user.
- Paid usage is charged from actual provider-reported input/output tokens; conservative estimates are used when usage is missing.
- Active model prices use an administrator-controlled rate card. Migration `0009` seeds a uniform `1.45x` markup over recorded provider cost.

### Managed Meta advertising

The customer pays Meta ad spend separately. UNREAL BS charges a management/setup fee from the wallet.

| Rule | Value |
|---|---:|
| Minimum total ad spend accepted | ৳1,000 |
| Standard management fee | 15% of ad spend |
| Minimum management fee | ৳199 |
| Maximum management fee | ৳2,999 |

Examples:

| Meta ad spend | UNREAL BS fee |
|---:|---:|
| ৳1,000 | ৳199 minimum |
| ৳2,000 | ৳300 |
| ৳10,000 | ৳1,500 |
| ৳20,000 or more | Up to the ৳2,999 cap |

### Starter service packages

| Service package | Starting price |
|---|---:|
| Lead Response & Recovery | ৳12,000 |
| Ad-to-Sale Conversion | ৳18,000 |
| Customer Reactivation | ৳10,000 |
| Appointment & No-Show Control | ৳9,000 |
| Trust & Review Growth | ৳8,500 |
| Premium Brand Upgrade | ৳25,000 |
| AI Service Worker | ৳15,000 |
| Sales Team Control | ৳16,000 |
| Client Experience Portal | ৳22,000 |
| Business Leak Audit | ৳7,500 |

These are starting prices. Final scope and price are confirmed manually before activation.

### Digital product and marketplace pricing rules

These are platform rules, not a claim that a public marketplace is currently enabled.

| Rule | Value |
|---|---:|
| Free product | ৳0 |
| Minimum paid-product price | ৳50 |
| Maximum accepted product price | ৳500,000 |
| Dormant future marketplace commission | 10% |
| Commission floor/cap | ৳10 / ৳2,000 |
| Dormant future payout minimum | ৳500 |

For the current platform-owned launch, the full confirmed sale price is platform revenue and seller payout is zero. Marketplace seller and payout APIs remain disabled.

### Items without a fixed public price

- Virtual cards: operator confirms the BDT charge for the requested card/provider.
- Custom services beyond the starter catalog: quoted after scope review.
- HighLevel subscription/licensing: external provider cost, not encoded as an UNREAL BS package.
- Meta advertising spend: paid separately to Meta.
- Dynamic digital products: each operator-published product carries its own price when commerce is enabled.

## 5. Direct software package inventory

The repository is standardized on Node.js `24.x` and npm `11.16.0`.

### Production dependencies

| Package | Declared version | Purpose |
|---|---|---|
| `next` | `16.3.0` | App Router, server rendering, APIs, metadata, deployment build |
| `react`, `react-dom` | `19.2.4` | User interface runtime |
| `next-auth` | `^5.0.0-beta.32` | Credentials/JWT authentication |
| `@supabase/supabase-js` | `^2.110.8` | Database, storage, and service-role integration |
| `@tanstack/react-query` | `^5.101.4` | Client-side server-state handling |
| `next-intl` | `^4.13.3` | Internationalization support |
| `react-hook-form`, `@hookform/resolvers`, `zod` | `^7.82.0`, `^5.4.0`, `^4.4.3` | Forms and schema validation |
| `zustand` | `^5.0.14` | Focused client state |
| `bcryptjs` | `^3.0.3` | Password hashing/verification |
| `framer-motion` | `^12.42.2` | Purposeful UI motion |
| `lucide-react` | `^1.25.0` | Interface icons |
| `recharts` | `^3.10.0` | Dashboard charts |
| `@monaco-editor/react` | `^4.7.0` | App Developer code editor |
| `clsx`, `tailwind-merge` | `^2.1.1`, `^3.6.0` | Component class composition |

`dompurify` is security-pinned through an npm override at `3.4.13`.

### Development and verification dependencies

- Playwright `^1.62.1` for desktop/mobile browser testing.
- Vitest `^4.1.10` for unit tests.
- TypeScript `^5` and React/Node type packages.
- ESLint `^9` with `eslint-config-next` `16.3.0`.
- Tailwind CSS `^4` and `@tailwindcss/postcss`.

The lockfile contains transitive packages required by these direct dependencies; they are implementation internals rather than separate customer-facing platform packages.

## 6. PWA technical design and safety

- `app/manifest.ts` produces `/manifest.webmanifest` through the supported Next.js 16 App Router convention.
- `public/pwa/` contains 192px, 512px, and maskable 512px PNG icons based on the existing brand icon.
- `components/pwa/ServiceWorkerRegistration.tsx` registers `/sw.js` invisibly after page load.
- `/sw.js` activates immediately but has no fetch/cache handler.
- `/sw.js` is publicly reachable while application/dashboard routes retain their authentication boundary.
- Service-worker headers prevent stale worker caching and restrict script sources to the same origin.
- Existing CSP already allows same-origin workers.
- Existing Meta scripts, consent choice, attribution, and CAPI behavior are unchanged.
- Existing application visible copy and layout are unchanged.

### Facebook SDK for iOS applicability

The Facebook SDK for iOS (`FBSDKCoreKit`, `FBSDKLoginKit`, and related CocoaPods or Swift Package Manager libraries) is for a native Xcode application. This repository is a browser-delivered Next.js application and contains no `Podfile`, `Package.swift`, `.xcodeproj`, `.xcworkspace`, or native `ios/` target. Installing native FBSDK packages here would not be executable and would add an unrelated native architecture, so no CocoaPods or SPM dependency was added.

On iPhone and iPad, the installed UNREAL BS PWA continues to use the same consent-gated web Meta Pixel and server-side Conversions API implementation as Safari. If a separately packaged native iOS application is commissioned later, it should receive its own reviewed Xcode target, current Facebook iOS SDK dependency, App ID configuration, privacy declarations, and native-event validation.

## 7. Required environment configuration

No new environment variable is required for PWA installation. Existing feature-specific variables remain required for the corresponding platform capabilities, including authentication, Supabase, GoHighLevel, payment destinations, AI providers, Meta measurement, Turnstile, and feature flags. Secret values must remain in Vercel/server environments and must never be committed or exposed to browsers.

## 8. Operational limitations

- Installation does not make the application an offline accounting/payment system; internet connectivity remains required.
- Browser installation wording differs across Chrome, Edge, Safari, operating-system versions, and enterprise browser policy.
- iOS installation is performed through Safari's Share → Add to Home Screen flow rather than Chromium's `beforeinstallprompt` event.
- A native App Store binary and native Facebook iOS SDK are outside this browser-PWA release; there is no native iOS target in the repository.
- Public commerce, marketplace sellers, and payouts remain intentionally disabled until their feature flags and payment launch gates are approved.
- Current production AI rate-card values could differ from migration seed values after an administrator edit; signed-in operational screens are authoritative at purchase time.
