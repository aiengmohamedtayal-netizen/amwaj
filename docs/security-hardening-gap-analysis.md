# AMWAJ Security Hardening — Gap Analysis

**Prepared:** 14 August 2026  
**Scope:** This document maps the supplied hardening plan only to the evidence in the prior read-only audit. It does not broaden the remediation scope or alter Supabase schema, RLS, Admin Copilot, AI Pre-fill, Direct Actions, or existing CRUD behavior.

## Decision summary

The audit confirmed that the client-side `is_admin` indicator is not the authorization boundary: live RLS policies and server-side checks enforce `private.is_admin()` for administrative operations. The remediation therefore preserves those controls unchanged. The immediate repository work focuses on browser hardening, compatible API validation/CORS/cost controls, and the normal-path review submission flow. Items requiring a distributed state service, an RLS policy change, or a Supabase Auth dashboard change are treated explicitly as external-control gates rather than silently approximated.

| Plan item | Audit evidence | Classification | Execution decision |
| --- | --- | --- | --- |
| CSP and browser headers | The production response lacked an application CSP, `frame-ancestors`, `Permissions-Policy`, `Referrer-Policy`, and `X-Content-Type-Options`. | Confirmed weakness | Add a compatibility-tested, enforced header baseline in `vercel.json`. The existing public HTML has inline handlers and inline scripts, so `'unsafe-inline'` is temporarily required and documented; strict nonce/hash CSP is out of scope without an HTML refactor. |
| Distributed AI limiting | `api/chat.js` and `api/trip-planner.js` each use per-instance in-memory maps keyed from forwarding headers. No distributed KV, Redis, or edge rate-limiting facility is configured in the repository. | Confirmed weakness | Harden each endpoint locally with trusted Vercel IP precedence, bounded request/workload validation, `Retry-After`, request timeout, and bounded in-memory fallback. A truly distributed control requires a Vercel Firewall rule or a provisioned shared store; it will not be misrepresented as complete. |
| AI cost controls | Chat accepts up to 30 messages × 24,000 characters and arbitrary client `tools`; both endpoints lack outbound abort timeouts. | Confirmed weakness | Add bounded body, prompt/context, tool, output, timeout, and friendly-error controls without altering provider selection or AI behavior for valid requests. |
| Review anti-abuse | The review browser code relies on a honeypot and `localStorage` cooldown, then inserts directly into Supabase REST. The current public INSERT RLS route remains reachable to a direct REST caller. | Confirmed weakness | Add a server-side normal-path endpoint with validation and bounded abuse controls, and move the site UI to it. Complete boundary enforcement remains blocked by the instruction not to change the existing public-insert RLS policy; direct REST bypass remains documented. |
| Leaked password protection | Supabase Security Advisor reported leaked-password protection disabled. | Confirmed weakness | This is a Supabase Auth project setting, not a repository setting. It cannot be safely completed through source code; verify whether an authorized management control is available, otherwise request the user to enable it. |
| CORS cleanup | `api/chat.js` sends `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`; other public APIs are wildcard/no-credentials. | Confirmed weakness | Remove unnecessary credentials from public endpoints, unify allow methods/headers, and add `Vary: Origin` only to endpoints that reflect a validated origin. |
| CDN SRI | Admin pages load a fixed Font Awesome asset from cdnjs without SRI. | Confirmed weakness | Pin the existing version to its published SRI hash with `crossorigin="anonymous"`. The Tailwind CDN runtime is retained because converting it is a separate build-system change. |
| Least privilege for admins | Existing policy intentionally permits administrator management through protected server/database paths; business role separation is not specified. | Hardening opportunity | Do not change roles, grants, RLS, or admin business operations. Record as a business decision for a future, separately approved review. |
| Audit logging | Administrative action logging exists. No safe, durable store for public abuse telemetry is available without schema/configuration changes. | Hardening opportunity | Retain current logging and avoid logging secrets, tokens, or raw sensitive prompts. Use privacy-minimized server logs for new abuse controls. |

## Implementation gates

| Gate | Status | Reason |
| --- | --- | --- |
| No new dependency | Approved | Planned fixes use platform/runtime capabilities and existing browser/server JavaScript only. |
| No schema/RLS change | Enforced | The review API will not modify database policies. This also limits the endpoint to a normal-path improvement, not a complete bypass-proof boundary. |
| Admin Copilot, AI Pre-fill, Direct Actions | Preserved | No functional redesign is planned; only public API helpers and headers are in scope. |
| Supabase Auth leaked-password control | External configuration | Requires an authorized project-setting operation and separate confirmation if it must be done in a browser. |
| Distributed rate limiting | External infrastructure | Vercel WAF/rate rules or a shared data store must be provisioned before this can be called distributed. |

## References

[1]: https://owasp.org/Top10/2025/A02_2025-Security_Misconfiguration/ "OWASP Top 10 2025: Security Misconfiguration"
[2]: https://owasp.org/Top10/2025/A06_2025-Insecure_Design/ "OWASP Top 10 2025: Insecure Design"
[3]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase: Row Level Security"
[4]: https://vercel.com/docs/cdn-security/security-headers "Vercel: Security Headers"
