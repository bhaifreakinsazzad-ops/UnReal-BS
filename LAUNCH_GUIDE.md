# 🚀 Platform Launch Execution Guide

This guide walks you through the automated and manual steps to launch the platform.

## Prerequisites
- Supabase CLI installed and logged in (`supabase login`)
- Project linked (`supabase link --project-ref YOUR_REF`)
- Production environment variables accessible

---

## Phase 1: Database Migration (Automated)

Run the migration script:
```bash
./launch_automation.sh
```

**What this does:**
1. Creates a pre-migration snapshot backup
2. Applies all pending migrations (including 0015)
3. Creates a post-migration verification snapshot
4. Saves logs to `logs/` directory

**Expected Output:**
- `logs/pre_migration_snapshot_YYYYMMDD_HHMMSS.txt`
- `logs/post_migration_snapshot_YYYYMMDD_HHMMSS.txt`

---

## Phase 2: Environment Configuration (Manual)

Update your production environment (Vercel/Server) with:

```bash
# Payment Destinations (Replace with actual numbers)
PLATFORM_BKASH_NUMBER=01XXXXXXXXX
PLATFORM_NAGAD_NUMBER=01XXXXXXXXX
PLATFORM_ROCKET_NUMBER=01XXXXXXXXX

# Feature Flags
COMMERCE_ENABLED=true
STORE_PUBLIC_ENABLED=false       # Keep false during canary
PAYMENT_GATEWAY_ENABLED=true
CSP_ENFORCE=false                # Enable after Meta verification

# Canary Configuration
COMMERCE_CANARY_EMAILS=your-operator-email@example.com

# Security & Tracking
AUTH_SECRET=<generate-new-secret>
META_CAPI_ACCESS_TOKEN=<your-token>
TURNSTILE_SITE_KEY=<your-site-key>
TURNSTILE_SECRET_KEY=<your-secret-key>
```

---

## Phase 3: Canary Testing (Semi-Automated)

Run the canary preparation script:
```bash
./canary_tests.sh
```

**Manual Testing Steps (Required):**
1. Login as a canary user (email in `COMMERCE_CANARY_EMAILS`)
2. Create a **FREE** product → Complete checkout → Verify access
3. Create a **BDT 50** product → Initiate payment → Verify webhook
4. Confirm buyer access after payment confirmation
5. Process a **REFUND** with reason "Canary Test"
6. Check wallet balance reconciliation
7. Verify no duplicate audit log entries
8. Use [Meta Test Events](https://www.facebook.com/events_manager/) to verify:
   - `Lead` event fires on checkout init
   - `Purchase` event fires ONLY after payment confirmation
   - No duplicate events

**Record Results:**
Update `logs/canary_test_log.txt` with pass/fail status for each step.

---

## Phase 4: 24-Hour Soak Period (Manual Monitoring)

After canary tests pass:

1. **Enable Public Store:**
   Set `STORE_PUBLIC_ENABLED=true` in production env.

2. **Monitor These Metrics for 24 Hours:**
   - Error rate (should be < 0.1%)
   - Payment failure rate (should be < 1%)
   - Wallet balance discrepancies (should be 0)
   - Meta Pixel event deduplication (verify in Events Manager)
   - CSP violation reports (check `/api/csp-report`)

3. **Alert Thresholds:**
   - > 5 payment failures in 1 hour → Investigate immediately
   - Any wallet balance mismatch → Pause commerce, audit logs
   - CSP violations for Meta domains → Do not enable `CSP_ENFORCE`

---

## Phase 5: Full Launch (After Soak)

If 24-hour soak passes:

1. Set `CSP_ENFORCE=true`
2. Update `robots.txt` to allow indexing:
   ```txt
   User-agent: *
   Allow: /
   ```
3. Begin advertising campaigns
4. Monitor Meta CAPI conversion matching quality

---

## Troubleshooting

### Migration Fails
```bash
supabase db reset --linked  # WARNING: Deletes data, use only in dev
supabase db push            # Retry push
```

### Canary Payment Fails
- Check `PLATFORM_*_NUMBER` values are correct
- Verify payment gateway webhook endpoint is publicly accessible
- Review `logs/payment-webhook.log` (if available)

### Meta Events Not Deduplicating
- Ensure `fbp` and `fbc` parameters are passed server-side
- Verify `event_id` is consistent between client and server calls
- Use Meta's "Test Events" tool to debug in real-time

---

## Post-Launch Checklist

- [ ] Migration 0015 applied and verified
- [ ] Canary tests passed (free + paid + refund)
- [ ] 24-hour soak period completed with no critical issues
- [ ] `CSP_ENFORCE=true` active
- [ ] `robots.txt` updated for SEO
- [ ] Legal pages (Terms, Refund Policy) published
- [ ] Support contact mechanism active
- [ ] Monitoring alerts configured

---

**Generated:** $(date)
**Scripts:** `launch_automation.sh`, `canary_tests.sh`
