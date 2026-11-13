# Changelog

## Unreleased — pre-advertising launch hardening

### Added

- Platform-only commerce flags, opaque hashed buyer access, payment lifecycle controls, append-only audits, health endpoints, Turnstile application protection, marketing consent, Meta CAPI delivery, Playwright gates, and exact-SHA release automation.

### Changed

- Standardized Node/npm and upgraded Next.js/DOMPurify.
- Reduced sessions to eight hours and added ten-minute password re-verification for sensitive actions.
- Changed product ownership and launch revenue to platform-only behavior.
- Changed paid access to require explicit operator confirmation and evidence.
- Changed public mutation handling to enforce origin, content type, payload limits, request IDs, and high-value throttles.

### Security

- Centralized administrator checks, redacted sensitive logs, restricted uploads/downloads, revoked browser-role commerce/RPC access, pinned function search paths, and added unique payment/refund references.
- Upgraded Next.js and its image-processing dependency chain to patched releases, clearing the critical RCE and high-severity dependency advisories reported by `npm audit`.

### Operations

- Commerce and advertising remain disabled until the gates in `PRE_AD_LAUNCH_RUNBOOK.md` pass.
