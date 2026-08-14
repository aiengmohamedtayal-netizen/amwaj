# Security Hardening — Local Browser Verification

**Date:** 2026-08-14

The existing local AMWAJ site was opened at `http://localhost:4173/`. The public page rendered successfully after the security hardening changes. The customer-review call-to-action remained visible, could be selected, and the page showed no visible rendering regression. No form fields were filled and no review, inquiry, AI request, or production request was submitted during this verification.

The browser inspection was intentionally limited to a safe UI smoke test. The API behaviors, validation boundaries, rate limiting, honeypot discard behavior, and response headers are covered by the automated regression suite in `tests/security-hardening.test.mjs`.

## Scope limitation

The local Python static server does not execute Vercel serverless functions or apply the `vercel.json` response headers. Therefore it cannot validate deployed headers or the `/api/reviews` backend route end-to-end. Those controls were validated with local handler tests and configuration assertions; deployment verification remains necessary after a production deployment.
