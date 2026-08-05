# QA Report

Updated: 5 August 2026

## Automated results

| Check | Result |
|---|---|
| Installation baseline | Earlier clean `npm ci` PASS (481 packages); final lockfile retry timed out on the Windows workstation after npm audit, while lock-respecting `npm install` restored the tree |
| ESLint | PASS, zero warnings |
| TypeScript | PASS |
| Vitest | PASS, 124 tests across 15 files |
| Dependency audit | PASS, 0 vulnerabilities across production and development dependencies |
| Next.js production build | PASS on Next.js 16.3.0 |
| Migration syntax | PASS, PostgreSQL parser accepted 100 statements |
| Playwright | PASS, 11 passed and 4 intentionally skipped duplicate project checks |

## Security and database evidence

- Production project identity verified as `UnReal BS by NRE` (`cgbkfrczghpfhyhhjauh`), active/healthy.
- Migration history contains the expected 0013 commerce and 0014 wallet guard migrations.
- Immutable pre-migration aggregate snapshot: 3 users, 3 wallets, BDT 0.00 aggregate wallet balance, 0 ledger rows, 0 products, and 0 orders.
- Duplicate provider/payment-reference preflight returned no rows.
- Supabase security advisors identified mutable search paths and anonymous/signed-in execution of `rls_auto_enable()`; migration 0015 now pins paths and revokes exposed RPC execution. This is code-reviewed but not production-applied.
- Backup/PITR availability is not exposed by the connected control surface and remains a release blocker.
- The initialized standard Codex Security scan failed because its Windows review-inventory generator rejected the backslash paths it created. The external scan gate is unresolved and no no-findings claim is made.

## Browser matrix

The local production-mode Playwright run verified desktop, mobile, reduced motion, 320-1440px overflow safety, keyboard focus, the public funnel, consent-gated Meta loading, dark storefront behavior, authenticated redirects, capability-safe health endpoints, and preview CSP headers. Authenticated operator commerce and real provider event delivery still require the production canary.

The Chrome-control skill could not use its required Node REPL browser surface because that tool was unavailable in this workspace. Standalone Playwright supplied the reproducible browser evidence instead.

## Remaining gates

Required before advertising: production backup confirmation, reviewed pull request and exact-SHA green CI, successful external security scan or equivalent approved security review, dark deployment, migration validation, authenticated operator E2E, payment/refund canary, Meta Test Events deduplication proof, enforced-CSP validation, monitoring configuration, and the 24-hour soak.
