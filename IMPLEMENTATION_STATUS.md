# Implementation Status

Updated: 20 September 2026

## Completed in code

- Preserved the commerce candidate on `codex/commerce-candidate-snapshot` and moved reviewed work to `codex/pre-ad-launch`.
- Pinned Node 24.18.x/npm 11.16.0; upgraded Next.js to 16.3.5 and DOMPurify to 3.4.13.
- Added eight-hour sessions, centralized admin authorization, ten-minute password re-verification, request hardening, fail-closed high-value throttles, log redaction, audit events, CSP controls, and health endpoints.
- Added Turnstile to `/apply` only and removed the public GHL contact ID response.
- Converted launch commerce to platform-only ownership, zero seller payout, dark flags, manual operator-confirmed payment, hashed access tokens, restricted uploads, idempotent order/card mutations, and explicit rejection/refund evidence.
- Added consented Meta Pixel/CAPI attribution with shared event IDs and operator-confirmed `Purchase` semantics.
- Added additive migration 0015, CI, Playwright coverage, exact-SHA release workflow, and launch documentation.

## Verified locally

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm audit --omit=dev --json`
- `npm run build`
- SQL syntax parse for migration 0015

See `QA_REPORT.md` for exact counts and results.

## Operationally blocked / not activated

- Migration 0015 is not applied to production because backup/PITR evidence has not yet been confirmed.
- Production commerce/store/marketplace flags remain unchanged; no public launch was performed.
- Production payment numbers, Meta Pixel/CAPI credentials, and Turnstile keys require owner confirmation.
- The controlled free order, BDT 50 payment/refund, Meta Test Events proof, and 24-hour soak require the dark production deployment and migration first.
- The initialized standard Codex Security scan failed because its Windows review-inventory generator rejected its own backslash paths. The external scan gate is unresolved and no no-findings claim is made.
- Advertising remains blocked.
