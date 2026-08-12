# Vercel Deployment Check

**Date:** 2026-08-12

The GitHub push for commit `56520f4ee162d64b87e7c13c9aa347d977f8bf9e` triggered an automatic production deployment in the Vercel project `amwaj`.

| Item | Result |
|---|---|
| Vercel project | `amwaj` (`prj_i4HjtEdS1Hfpr0d0cnFb5WZDx7FP`) |
| Deployment | `dpl_GgpgGjJRAQpfijxnpK6tt2zyrdSh` |
| Commit | `56520f4` — `feat: add live pricing, bilingual blog, trip planner and admin` |
| Target | Production |
| State | `READY` |
| Deployment URL | https://amwaj-qzqwnsmqo-1942006.vercel.app |

The Vercel management page for environment variables redirects to the Vercel login screen in the current browser session. The Vercel management connector exposes deployment and diagnostic capabilities but does not expose an environment-variable write operation. Consequently, the remaining operation is adding the server-only `GROQ_API_KEY` in the Vercel project settings using an authenticated Vercel browser session. The key is not present in the repository or any source file.

## Post-configuration redeploy and smoke test

After the user added `GROQ_API_KEY` in the Vercel project settings, a no-code Git commit triggered the final production deployment:

| Item | Result |
|---|---|
| Final commit | `b3595d220a3fb6e95700f5673148650507f1d6ba` |
| Deployment | `dpl_6D9ohayJDvf8VkDLUrM9hRrDnffx` |
| Target | Production |
| State | `READY` |
| Deployment URL | https://amwaj-32b9n1n2q-1942006.vercel.app |
| Production smoke test | `POST /api/trip-planner` returned HTTP `200` |

The production endpoint returned the expected structured plan fields: `summary`, `itinerary`, `packing_list`, `budget`, and `booking_note`. The raw generated plan was deliberately discarded after its structure was verified; it has not been retained in the repository.
