# QA Report

Updated: 20 September 2026

## Automated results

| Check | Result |
|---|---|
| Installation baseline | PASS, clean `npm@11.16.0 ci` installed 495 packages from the lockfile |
| ESLint | PASS, zero warnings |
| TypeScript | PASS |
| Vitest | PASS, 130 tests across 16 files |
| Dependency audit | PASS, 0 vulnerabilities across production and development dependencies |
| Next.js production build | PASS on Next.js 16.3.5 |
| Migration syntax | Earlier PASS retained; PostgreSQL parser accepted 100 statements |
| Playwright | Current local rerun blocked by repeated browser-CDN timeouts; the prior run passed 11 tests with 4 intentional duplicate-project skips, and GitHub CI remains the required browser gate |

## Security and database evidence

- Production project identity verified as `UnReal BS by NRE` (`cgbkfrczghpfhyhhjauh`), active/healthy.
- Migration history contains the expected 0013 commerce and 0014 wallet guard migrations.
- Immutable pre-migration aggregate snapshot: 3 users, 3 wallets, BDT 0.00 aggregate wallet balance, 0 ledger rows, 0 products, and 0 orders.
- Duplicate provider/payment-reference preflight returned no rows.
- Supabase security advisors identified mutable search paths and anonymous/signed-in execution of `rls_auto_enable()`; migration 0015 now pins paths and revokes exposed RPC execution. This is code-reviewed but not production-applied.
- Backup/PITR availability is not exposed by the connected control surface and remains a release blocker.
- The initialized standard Codex Security scan failed because its Windows review-inventory generator rejected the backslash paths it created. The external scan gate is unresolved and no no-findings claim is made.

## Browser matrix

The earlier local production-mode Playwright run verified desktop, mobile, reduced motion, 320-1440px overflow safety, keyboard focus, the public funnel, consent-gated Meta loading, dark storefront behavior, authenticated redirects, capability-safe health endpoints, and preview CSP headers. A 20 September live smoke pass also verified the production landing, application, privacy, terms, login, signup, health, and dark-storefront boundaries without site-originated browser errors. Authenticated operator commerce and real provider event delivery still require the production canary.

The Chrome-control skill could not use its required Node REPL browser surface because that tool was unavailable in this workspace. Standalone Playwright supplied the reproducible browser evidence instead.

## Remaining gates

Required before advertising: production backup confirmation, reviewed pull request and exact-SHA green CI, successful external security scan or equivalent approved security review, dark deployment, migration validation, authenticated operator E2E, payment/refund canary, Meta Test Events deduplication proof, enforced-CSP validation, monitoring configuration, and the 24-hour soak.
