# Pre-Advertising Launch Runbook

## Non-negotiable state

Keep these production values off for the initial deployment:

```text
COMMERCE_ENABLED=false
STORE_PUBLIC_ENABLED=false
MARKETPLACE_SELLERS_ENABLED=false
CSP_ENFORCE=false
```

Do not start advertising during migration, canary, or soak.

## Release evidence

1. Open a pull request from `codex/pre-ad-launch`; require owner review because repository branch protection is unavailable.
2. Record the exact full SHA. Require green CI and preview verification for that SHA.
3. Confirm Vercel production settings use Node 24 and `npm ci` and that required environment variables exist without exposing their values.
4. Use the manual exact-SHA workflow only. Save the deployment ID, SHA, and health responses.

## Production database sequence

1. Confirm Supabase project ref `cgbkfrczghpfhyhhjauh`, backup availability, and point-in-time recovery in the owner dashboard. Export immutable evidence.
2. Run `supabase/verification/pre_ad_launch_snapshot.sql` and save the result privately.
3. Confirm duplicate payment-reference checks return zero rows and wallet/ledger totals reconcile.
4. Deploy the code dark.
5. Apply migration 0015 as one reviewed migration. Do not manually paste partial statements.
6. Re-run the snapshot, migration history, security advisors, function ACL checks, indexes, constraints, and health readiness.
7. Confirm user count, wallet count/balance, ledger row/net totals, historical orders, and products are unchanged except explicitly expected migration metadata.

Do not reverse the database migration destructively. On failure, disable flags, roll back Vercel, and use a forward fix or the verified backup.

## Canary sequence

1. Configure and independently verify at least one platform bKash/Nagad/Rocket destination.
2. Set `COMMERCE_ENABLED=true` and `COMMERCE_CANARY_EMAILS` to operator-only addresses; keep public store and marketplace off.
3. Create and complete one free product journey.
4. Create a BDT 50 product, make a controlled transfer, submit its reference, confirm via password re-verification, verify buyer access, then record and complete a refund with a refund reference and reason.
5. Reconcile order, audit, and balance records. Confirm no duplicate reference or Meta event.
6. Enable `STORE_PUBLIC_ENABLED=true`, keep advertising paused, and soak for 24 hours.

## Meta and CSP

1. Verify decline blocks Pixel network requests and consent allows them.
2. Use Meta Test Events to prove deduplicated `Lead` and `Purchase`; `Purchase` must occur only after paid confirmation.
3. Validate CSP reports for Next.js, Puter, Meta, Monaco, Turnstile, YouTube/Vimeo, storage, images, and fonts in preview and canary.
4. Only then set `CSP_ENFORCE=true` and repeat the route/browser matrix.

## Advertising gate

Advertising remains blocked unless the exact production SHA has green CI; the production dependency audit has zero Critical/High issues; the external scan has no unresolved reachable Critical/High/Medium findings; auth, tenant, card, money, and commerce journeys pass; backup/reconciliation evidence exists; payment and refund canaries pass; Meta deduplication and privacy withdrawal are verified; monitoring alerts are active; and the 24-hour soak has no unexplained 5xx, reconciliation mismatch, duplicate event, or security incident.
