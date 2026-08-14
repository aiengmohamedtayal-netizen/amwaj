# Architecture Decision — AMWAJ State Management

**Decision:** Adopt **small native Vanilla JavaScript modules with narrowly scoped state helpers**. Do **not** add Zustand, Redux, React, Next.js, or any new runtime dependency.

The audit found state domains that are small, page-scoped, or already naturally separated by independently loaded JavaScript files. A dependency-based client store would add bundle weight, a new mental model, and additional integration risk without solving a demonstrated cross-consumer problem. The existing browser and server boundaries are sufficient when made explicit through a few focused helpers.[1] [2]

> **Architectural principle:** Supabase and serverless APIs remain the source of truth. Browser state exists only for UI behavior, bounded caches, navigation, preferences, and unsaved work.

| Decision area | Chosen approach | Reason | Explicitly rejected |
|---|---|---|---|
| Public preferences | One tiny browser preference module for language and direction | Language is the only recurring public cross-module preference. | A global public application store. |
| Public server data | Module-local fetch state and a bounded AI context cache | Content, blog, pricing, and reviews are rendered by independent consumers and Supabase remains authoritative. | Mirroring all public rows into one global store. |
| Public AI | A local AI state controller inside the existing `ai-agent.js` domain | Chat history and lifecycle are used only by the AI UI; the five-minute data cache remains bounded. | Exposing mutable AI conversation arrays globally. |
| Admin UI | A small admin state/cache helper for auth, route, and page data | Admin has legitimate shared consumers within its own application shell, but editor data remains local. | One catch-all mutable state bag covering all form and AI data. |
| Admin server data | Per-page cache plus explicit invalidation / refetch after mutation | The administrator should always see confirmed server results after CRUD actions. | Optimistic global copies that can diverge from Supabase. |
| Admin editors | Dialog-local form state and local dirty state | Forms are single-consumer, short-lived, and correctly clean object URLs on close. | Lifting fields, validation, or dirty state into global state. |
| Admin Copilot | Preserve two separate paths: verified editor pre-fill and confirmation-gated direct action | Existing safety and human-review behavior is correct. | Auto-save from pre-fill or combining drafts with direct mutations. |
| Lazy loading | No dynamic import in this refactor unless measured evidence shows a heavy isolated module | Existing scripts are classic scripts and the audit shows no module loader baseline. A speculative conversion can regress deployment/runtime behavior. | Adding dynamic imports merely to meet an optimization label. |

## Required Minimal Refactor

The approved implementation is limited to these changes:

1. Add `js/app-preferences.js` as a small public preference boundary. It owns the persisted language value, updates `lang` and `dir`, publishes one `amwaj:languagechange` event, and preserves legacy global `setLanguage` / `toggleLanguage` entry points.
2. Update `js/i18n.js` to delegate to the preference boundary when it exists, retaining a safe fallback for standalone or legacy pages.
3. Update `js/blog.js` to consume the shared language event and remove its independent persistent language writer, while keeping posts and categories module-local.
4. Add `admin/js/admin-state.js` as an admin-only helper. It owns only auth, route, per-page server cache, mutation invalidation, and subscription notifications. It does not own editor forms, dialogs, Copilot conversation/history, or arbitrary DOM state.
5. Update `admin/js/admin-app.js` to use the helper for existing route/auth/data state and to invalidate the appropriate server cache after confirmed mutations before refetching. Preserve current editor and Copilot behavior.
6. Encapsulate the public AI conversation lifecycle in `js/ai-agent.js`, retaining the existing global function names used by HTML event handlers and retaining the current force-refresh live-data behavior for tool calls and trip planning.
7. Add focused native Node tests for the new helpers and source-level integration assertions. No package installation is needed.

## Dependency Gate

No external dependency is justified. The following questions were checked and all answer **no**:

| Gate question | Result | Evidence |
|---|---|---|
| Is a reactive UI framework already used? | No | Active entry points use plain script files and imperative DOM rendering. |
| Does one complex state graph span unrelated public and admin surfaces? | No | Public and admin are separate entry points and state islands. |
| Is time-travel debugging, reducer composition, middleware, or a large subscription graph required? | No | No audited workflow requires it. |
| Can the required boundaries be expressed with ES modules, closures, and `CustomEvent`? | Yes | Existing code already uses closures, custom events, and browser storage safely. |
| Would a dependency reduce measured bundle/runtime cost? | No | It would add runtime code where the baseline has no package build pipeline. |

Because no external library is necessary, the execution proceeds without a user-approval pause.

## Invariants for Implementation

| Invariant | Enforcement |
|---|---|
| Public and admin state never share a mutable store. | `js/app-preferences.js` contains public preference data only; `admin/js/admin-state.js` is loaded only in admin pages. |
| Supabase/API is authoritative. | Every mutation is followed by cache invalidation and a server refetch; no editor prefill is auto-persisted. |
| AI pre-fill remains human-reviewed. | The existing `sessionStorage` key, allowed-field filtering, and dialog handoff remain unchanged. |
| Direct Actions remain separately confirmation-gated. | Existing Copilot mutation flow and `amwaj:copilot-mutated` event remain unchanged. |
| Unsaved changes remain local. | `openDialog` continues to own dirty tracking and object URL cleanup. |
| Lazy loading is evidence-based. | No dynamic import is introduced without an isolated, measured code-splitting target. |

## References

[1]: ./state-inventory.md "State inventory and map"
[2]: ./state-audit-raw-metrics.md "Raw audit metrics"
[3]: ../admin/js/admin-app.js "Admin application"
[4]: ../admin/js/admin-copilot.js "Admin Copilot"
[5]: ../js/ai-agent.js "Public AI client"
