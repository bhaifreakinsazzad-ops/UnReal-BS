# UNREAL BS — Main Operator Takeover

Audit date: 2026-08-05 (Asia/Dhaka)

This is the operational source of truth for taking over UNREAL BS. It separates what is deployed, what exists only in the workstation, what is connected to live services, and what still needs human or credentialed verification.

## Executive status

UNREAL BS is a live Next.js business operating system for Bangladeshi small businesses. The deployed product combines CRM and automation through GoHighLevel, a tenant-aware Supabase data layer, prepaid wallet and ledger controls, AI subscription billing, virtual-card operations, Udhar Khata, managed Meta-ad campaign intake, public acquisition pages, and administrative control surfaces.

Production is online and serving the latest GitHub `main` commit. The codebase is locally buildable and its current 105 tests pass. It is not yet a clean release train because GitHub CI is red, the workstation contains a large uncommitted commerce release candidate, several Vercel environment-variable names do not match the names consumed by the code, and authenticated production journeys have not been re-tested in this audit.

Operator verdict: safe to continue development from this workstation, but do not deploy the dirty working tree until its migrations, payment configuration, security boundaries, and end-to-end checkout/payout flows are verified in a controlled release.

## Authoritative control surfaces

| Surface | Current authority |
|---|---|
| Local checkout | `F:\Dev Factory\BhaiFreakin - Universal\unreal-bs` |
| Local branch | `master` |
| GitHub repository | `bhaifreakinsazzad-ops/UnReal-BS` (private) |
| GitHub default branch | `main` |
| Current source commit | `5a937e363f3d55e26eb6233d98e1014cab3c92cf` |
| Vercel team/project | `dhandabuzz/unreal-bs` |
| Vercel project ID | `prj_EUfcLPgmuUODzPn5AipR0SpCO18u` |
| Vercel team ID | `team_jcEr4qNMyI3B1Eug5Bo9RuAn` |
| Current production deployment | `dpl_2JSZSsgTMyjmoc8nRDG4tEfhaRgX` |
| Deployment URL | `https://unreal-dui8b8l5z-dhandabuzz.vercel.app` |
| Canonical production host | `https://www.unreal-bs.shop` |
| Apex behavior | `https://unreal-bs.shop` redirects to `www` |

The local `.vercel/project.json` points to the same Vercel team and project. GitHub `main`, local `HEAD`, and the current Vercel deployment all resolve to commit `5a937e3`.

## Production evidence

Vercel reports the current deployment as `READY`, target `production`, source `git`, framework `nextjs`, Node.js `24.x`, region `iad1`, and aliases including both custom domains and the Git branch alias. The deployment was built from private GitHub repository `bhaifreakinsazzad-ops/UnReal-BS`, branch `main`, commit `5a937e3`.

The last seven days of Vercel runtime telemetry showed no grouped runtime error clusters. Observed status counts were predominantly 200 and expected authentication redirects; no 5xx group was returned. The only notable 404 traffic included ordinary missing routes and automated `/wp-admin/install.php` probes.

Cookie-free HTTP probes on 2026-08-05:

| Route | Result | Interpretation |
|---|---:|---|
| `https://unreal-bs.shop/` | 308 | Canonicalizes to `www` |
| `https://www.unreal-bs.shop/` | 307 | Protected root redirects to login |
| `/login` | 200 | Public authentication page |
| `/unreal-bs` | 200 | Public product/marketing page |
| `/apply` | 200 | Public application page |
| `/signup` | 200 | Public registration page |
| `/opportunities` | 307 | Protected dashboard route |
| `/products` | 307 | Protected; current production does not expose the local public storefront rules |
| `/p/not-a-real-product` | 307 | Confirms local storefront middleware changes are not deployed |

The direct deployment URL is protected by Vercel Authentication for normal direct access. The connected Vercel control surface can still inspect the deployment.

## Architecture

- Next.js 16.2.11 App Router with React 19.2.4 and Turbopack.
- Tailwind CSS 4 with a custom bilingual visual system.
- NextAuth v5 credentials/JWT sessions in `auth.ts`.
- Root `proxy.ts` is the request authentication boundary.
- Supabase/Postgres is the persistent product database; server access uses the service-role client.
- GoHighLevel is the CRM/automation system of record and is accessed only from server-side wrappers in `lib/ghl`.
- User/tenant resolution lives in `lib/tenant.ts`; non-admin users receive their own GHL location mapping.
- AI providers are isolated behind typed adapters in `lib/ai-providers`.
- Money movement uses database functions and append-style wallet ledger entries rather than client-side balances.
- Meta ads support an honest `managed` fulfillment path and a gated API path.
- Current local commerce work uses one product model for courses, downloads, services, and consultations.

## Feature truth

### Deployed and connected or substantially functional

- Credentials authentication, public signup, tenant-aware sessions, and admin fallback.
- Control Room/dashboard using real wallet and Udhar Khata values where configured.
- GoHighLevel contacts, conversations, workflows, sites, brand/location data, and server-only proxying.
- Agent Studio inventory, execution contract, Voice AI inventory, and analytics reads within granted GHL scopes.
- Wallet balance, ledger, manual deposit requests, admin confirmation, and database money guards.
- Udhar Khata debt/invoice/payment attribution.
- AI subscriptions, bundles, rate-card administration, daily spend caps, free tier, usage charging, and provider capability detection.
- Virtual-card request, admin assignment, encrypted credential storage, and controlled reveal.
- Managed Meta-ad campaign intake, service fee charging, admin fulfillment, and automatic wallet refund on rejection/failure paths.
- Public `/unreal-bs`, `/apply`, `/signup`, privacy, and terms routes.
- Persisted coming-soon interest capture.

### Intentionally limited or coming soon

- Opportunities and Credit Center are honest coming-soon surfaces, not live marketplaces or underwriting systems.
- MeetAlly, Agentic HQ, Skills, and Clan are not production feature systems.
- Social Market publishing is disabled; do not describe it as a connected social publisher.
- Integrations is primarily a catalog/launchpad, not a complete OAuth connection manager.
- The service marketplace contains a small starter catalog, not a verified 400-service operational catalog.
- Meta Marketing API publishing remains off until App Review, Advanced Access, Business Verification, customer OAuth, and payment-account requirements are satisfied.
- Agent Studio write capabilities depend on GHL scopes and must not be inferred from read/analytics success.

## Protected local release candidate

The workstation is deliberately dirty. It contains five modified tracked files and 51 untracked files. Forty-eight of the untracked files form a digital-commerce implementation; two are investor deliverables and one is Claude launch configuration.

Local scope added beyond production:

- Seller product management for courses, downloads, services, and consultations.
- Public product and seller-store pages.
- Tokenized checkout and paid-buyer learning/download access.
- Manual bKash/Nagad/Rocket payment instructions and TrxID submission.
- Admin order confirmation/refund queue.
- Seller sales reporting and payout requests.
- Admin product review and payout settlement.
- GHL buyer-contact/tag synchronization.
- Private Supabase Storage assets with short-lived signed downloads.
- Migration `0013_digital_products.sql` and wallet sign guard migration `0014_wallet_sign_guards.sql`.

Commerce rules currently encoded and unit-tested:

- 10% platform commission.
- Minimum commission BDT 10 and maximum BDT 2,000.
- Paid products must be at least BDT 50; free products are allowed.
- Maximum accepted product price is BDT 500,000.
- Minimum payout request is BDT 500.
- Seller payout is the exact remainder after commission.
- Order confirmation is single-winner/atomic to prevent duplicate seller credit.
- Refund status and seller-wallet clawback are one transaction.
- Payout money is reserved by debiting at request creation and returned on rejection.

Local snapshot size versus deployed commit:

| Inventory | Deployed commit | Local working tree |
|---|---:|---:|
| Page files | 39 | 49 |
| API route files | 35 | 50 |
| SQL migrations | 12 | 14 |
| Unit-test files | 3 | 6 |

Do not discard, reset, blanket-stage, or deploy these files. Before release they need a dedicated branch, migration rehearsal, payment-number configuration, authenticated browser tests, and a staged diff review.

## Environment configuration audit

The Vercel project currently exposes 19 sensitive environment-variable names. Values were not printed or copied. Core names present for production include `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `GHL_PRIVATE_TOKEN`, `GHL_LOCATION_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `CARD_CREDENTIAL_ENC_KEY`.

Aligned optional provider names include `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `COHERE_API_KEY`, and `TAVILY_API_KEY`.

Name mismatches that currently disable code paths even if values exist:

| Vercel name | Code expects | Effect |
|---|---|---|
| `CEREBAS_API_KEY` | `CEREBRAS_API_KEY` | Cerebras adapter remains unavailable |
| `GEMINI_API_KEY` | `GOOGLE_AI_API_KEY` | Google/Gemini adapter remains unavailable |
| `HUGGING_FACE_API_KEY` | `HUGGINGFACE_API_KEY` | Hugging Face adapter remains unavailable |
| `CLOUDFARE_API_KEY` | `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` | Cloudflare adapter remains unavailable |

`GROQ_API_KEY` and `LLM7_API_KEY` are configured but are not consumed by the current repository.

Optional names absent from the current project listing include `MOONSHOT_API_KEY`, the Meta direct-publishing variables, and the local commerce payment variables `PLATFORM_BKASH_NUMBER`, `PLATFORM_NAGAD_NUMBER`, `PLATFORM_ROCKET_NUMBER`, and `PAYMENT_GATEWAY_ENABLED`. This is acceptable for features designed to remain disabled, but commerce checkout must not be released without at least one validated payment destination.

Environment-variable presence does not prove that sensitive values are non-empty or valid. Core authenticated/Supabase/GHL/provider flows require a controlled live test before the next release claim.

## GitHub and release governance

- The repository is private and has no open pull requests or issues.
- GitHub Actions is enabled and accepts all actions; action SHA pinning is not required.
- The current account/repository plan does not expose private-repository branch protection or rulesets, so `main` is not protected by an enforceable required-check policy.
- Local `master` tracks `origin/main`; releases historically push with `git push origin HEAD:main`.
- Vercel is connected to GitHub and deploys `main` to production.

### Blocking CI defect

All three available CI runs are failed. The current commit failed before linting because GitHub Actions uses Node 22 with npm 10.9.8, and `npm ci` rejects the committed lockfile:

`Missing: @swc/helpers@0.5.23 from lock file`

This is reproducible locally with `npx --yes npm@10.9.8 ci --dry-run`. The workstation's npm 11.16.0 accepts the same lockfile, which is why local checks pass. Fix by choosing and documenting one supported npm version, regenerating the lockfile with that version, then proving `npm ci` and the complete workflow on GitHub. Do not merely replace `npm ci` with `npm install` in CI.

## Verification performed in this audit

| Check | Result |
|---|---|
| Remote `main` SHA vs local `HEAD` | Pass — both `5a937e3` |
| Vercel deployment SHA vs GitHub | Pass — `5a937e3` |
| Vercel build status | Pass — `READY`, no build errors returned |
| Vercel grouped runtime errors, 7 days | Pass — none returned |
| Production unauthenticated routing | Pass for routes listed above |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass with 0 errors, 2 warnings |
| `npm test` | Pass — 105/105 tests, 6/6 files |
| `npm run build` | Pass — Next.js 16.2.11, 31 static pages generated |
| `npm audit --omit=dev` | Fail — 5 findings: 1 low, 1 moderate, 3 high |
| GitHub CI | Fail — lockfile/npm 10 incompatibility |

Lint warnings:

- `components/ui/avatar.tsx`: raw `<img>` may reduce image performance.
- `lib/meta/client.ts`: `_input` is unused.

Production dependency findings currently trace through `dompurify`/Monaco and `postcss`/`sharp` through Next.js. The audit proposes Next.js 16.3.0 for the high-severity chain, so remediation must be compatibility-tested rather than applied blindly.

## High-priority risk register

1. **Release gate is red.** A production deployment exists for a commit whose GitHub CI never reached tests or build.
2. **Dirty working tree is a mixed release candidate.** A mistaken blanket stage/push would deploy migrations and commerce behavior that production has not received.
3. **Environment-name drift disables several providers.** Correct names only after confirming which providers the business intends to fund and operate.
4. **Authenticated production behavior is not re-proven.** Login, tenant isolation, GHL reads/writes, wallet movements, AI charging, cards, ads, and admin roles need controlled accounts and transaction-safe acceptance tests.
5. **Commerce is not deployed or migrated.** Public storefront behavior seen in the local build does not exist on production.
6. **Manual payment operations need controls.** Commerce needs approved collection numbers, TrxID reconciliation, refund/payout runbooks, operator roles, and audit evidence.
7. **Dependency findings remain open.** Upgrade work must include browser and integration regression testing.
8. **Branch governance is weak.** Without protected `main`, process discipline and pull-request review are the only release controls.
9. **Documentation has drifted historically.** Product claims must remain tied to connected-flow evidence, not route presence or green local builds.
10. **No authenticated visual acceptance was performed here.** Responsive, keyboard, reduced-motion, and real-data browser states remain a release requirement.

## Required operating protocol

### Before any development

1. Confirm repository root, branch, `git status`, and remote SHA.
2. Treat all pre-existing dirty files as user-owned until explicitly assigned.
3. Read the affected Next.js 16 guide under `node_modules/next/dist/docs` before changing framework conventions.
4. Trace the full UI → API → service/database → response flow.
5. Preserve server-only GHL tokens, Supabase service-role access, tenant boundaries, wallet invariants, and Bangla/English product behavior.

### Before any commit

1. Run a secret scan and inspect every untracked file.
2. Use a dedicated `codex/...` branch unless the owner explicitly directs otherwise.
3. Fix the npm/lockfile contract and prove `npm ci` with the CI npm version.
4. Run typecheck, lint, unit tests, production build, and relevant integration/browser tests.
5. Stage specific files or use interactive staging; review `git diff --cached` completely.
6. Never include `.env.local`, real credentials, payment data, private customer data, or build output.

### Before any production deployment

1. Require a green GitHub CI run for the exact commit.
2. Review migrations and rehearse them against a safe Supabase environment or backup plan.
3. Compare required environment-variable names to Vercel by environment; verify values without printing them.
4. Test public entry points and protected redirects.
5. Test authenticated admin and normal-user roles, tenant isolation, and denied access.
6. For money changes, test success, duplicate submission, rejection, refund, insufficient balance, and retry/idempotency paths.
7. Deploy a preview first, inspect build/runtime logs, then promote the already-tested artifact.
8. Smoke-test the canonical `www` domain and monitor 5xx/runtime clusters after release.

### Rollback posture

- Vercel lists the current deployment and its immediate predecessor as rollback candidates.
- A Vercel rollback does not reverse a Supabase migration or money movement.
- Every schema release therefore needs an explicit compatible rollback/forward-fix plan before promotion.

## Recommended execution order

1. Repair and standardize npm/lockfile CI so the release gate is trustworthy.
2. Move the digital-commerce candidate onto a dedicated branch without disturbing current files.
3. Review migrations 0013/0014 for production data compatibility and rehearse them.
4. Resolve Vercel provider-name drift and remove unused variable names only after owner confirmation.
5. Configure and validate commerce collection details; keep gateway mode false until a real gateway exists.
6. Run authenticated local/preview E2E tests for seller product creation → public product → order → operator confirmation → buyer access → seller payout/refund.
7. Run role/tenant/security tests for all existing CRM, wallet, AI, card, and ad modules.
8. Remediate dependency vulnerabilities with a controlled Next.js upgrade and full regression suite.
9. Update README/status documentation to match the verified deployed product.
10. Release through preview, reviewed PR, green CI, production promotion, and post-release monitoring.

## Actions deliberately not performed

- No code, migrations, or environment settings were deployed.
- No Git branch was changed, staged, committed, pushed, or force-updated.
- No Supabase database mutation was performed.
- No live GHL contact, ad campaign, wallet transaction, order, payout, or provider charge was created.
- No secret values were printed or copied.
- GitHub Desktop UI automation could not be used because the required computer-use Node REPL surface was not exposed in this task runtime; the repository was instead verified through authenticated GitHub CLI and Git.

## Operator conclusion

The project is genuinely live and has a substantial connected backend, but its next safe milestone is operational hardening rather than another broad feature push. The immediate goal is to restore a trustworthy release gate, isolate the local commerce candidate, align configuration names, and produce authenticated connected-flow evidence before promotion.
