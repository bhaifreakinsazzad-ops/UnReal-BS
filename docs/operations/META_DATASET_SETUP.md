# Meta Pixel and Dataset production setup

UNREAL BS uses one consent-gated browser Pixel and one server-side Conversions
API destination. For a web dataset, `META_DATASET_ID` normally has the same
value as `NEXT_PUBLIC_META_PIXEL_ID`.

## Required Vercel variables

Configure these for both Preview and Production without committing their
values:

```text
NEXT_PUBLIC_META_PIXEL_ID=1035455475771760
META_DATASET_ID=1035455475771760
META_CAPI_ACCESS_TOKEN=<server-only dataset token>
META_GRAPH_API_VERSION=v25.0
META_TEST_EVENT_CODE=<temporary Events Manager test code>
```

The access token must never be prefixed with `NEXT_PUBLIC_`, pasted into a
browser script, printed in logs, or committed to Git.

## Validation procedure

1. In Meta Events Manager, open dataset `1035455475771760` and copy the current
   Test Event Code.
2. Add the dataset token and Test Event Code to the Vercel Preview environment.
3. Deploy a preview and sign in with the configured admin account.
4. Re-enter the admin password at `/admin/meta`, then select **Validate
   dataset**.
5. Confirm that the page reports one acknowledged event and that Meta Test
   Events shows a server `CompleteRegistration` event with the same event ID.
6. Add the token to Production, redeploy, and repeat the test once.
7. Remove `META_TEST_EVENT_CODE` after validation. Real events never read this
   variable, but removing temporary credentials keeps configuration clear.

The validation event contains only deterministic synthetic hashes. It is sent
with `test_event_code`, so it does not become a real registration or purchase
conversion.

## Production event rules

- `PageView` and browser events run only after marketing consent.
- `CompleteRegistration` is emitted only after a free account is created.
- `Lead` is emitted only after the HighLevel application succeeds.
- `InitiateCheckout` is emitted when a real checkout order is created.
- `Purchase` is emitted only after an operator confirms payment.
- Browser and server deliveries use the same event name and event ID for Meta
  deduplication.
- Email, phone and external ID are normalized and SHA-256 hashed server-side.
- `_fbc` and `_fbp` are included only after marketing consent.

Do not use the sample `$142.52 USD` Purchase payload against production. UNREAL
BS sends the actual confirmed amount in BDT, and synthetic validation uses
Meta Test Events only.
