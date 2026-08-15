# AMWAJ Production Baseline Findings

**Project:** `wufguxedvhqechlqwoye` (Amwaj), eu-central-1, ACTIVE_HEALTHY.

**Snapshot/branch status:** Supabase MCP exposed no backup/snapshot operation and `list_branches` returned an empty list. No paid Branch was created.

## Confirmed table baseline from `list_tables`

| Table | RLS | Rows reported |
|---|---:|---:|
| `public.profiles` | enabled | 1 |
| `public.destinations` | enabled | 3 |
| `public.packages` | enabled | 3 |
| `public.services` | enabled | 6 |
| `public.site_settings` | enabled | 5 |
| `public.pricing_offers` | enabled | 0 |
| `public.blog_categories` | enabled | 1 |
| `public.blog_posts` | enabled | 0 |
| `public.customer_reviews` | enabled | 0 |
| `public.admin_copilot_audit_logs` | enabled | 0 |
| `public.notion_admin_operation_logs` | enabled | 0 |

## Confirmed category values

The read-only query returned existing package categories: `family` (1), `honeymoon` (1), and `vip` (1). No package row currently uses `other`, `custom`, or `__other__`.

The combined multi-statement response did not expose all result sets through the MCP wrapper, so destinations, pricing, policy definitions, exact constraints, and orphan checks require separate read-only queries before any migration.

## Safety decision

No DDL or DML has been executed in Production. No schema, RLS policy, constraint, foreign key, or existing column/table has been changed.
