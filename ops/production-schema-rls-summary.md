# Production Schema and RLS Summary

## Existing business constraints confirmed

- `public.packages.category`: only `vip`, `family`, `honeymoon`.
- `public.destinations.category`: only `egypt`, `international`, `umrah`.
- `public.packages.currency` and `public.pricing_offers.currency`: only `EGP`.
- `public.pricing_offers.pricing_unit`: only `per_traveler`.
- `public.pricing_offers.trip_style` was not visible in the truncated constraints response and must be queried separately before migration.
- `public.pricing_offers.destination_id` references `public.destinations(id)` with `ON DELETE RESTRICT`.
- `public.pricing_offers.package_id` references `public.packages(id)` with `ON DELETE CASCADE`.
- `public.pricing_offers.service_id` references `public.services(id)` with `ON DELETE CASCADE`.
- `public.blog_posts.category_id` references `public.blog_categories(id)` with `ON DELETE RESTRICT`.
- Existing status, availability, price, currency, and content-completeness checks must remain unchanged.

## Existing RLS policy model confirmed

- Packages, destinations, services, pricing offers, blog categories, blog posts, site settings, reviews, profiles, and audit-log tables have RLS enabled.
- Public read is limited to published/active/approved/public rows according to each table's existing policy.
- Insert/update/delete for content tables is restricted to authenticated admins through `private.is_admin()`.
- Customer reviews allow anonymous/authenticated insert only when `status = 'pending'`, `reviewed_at IS NULL`, and `is_featured = false`; public reads are approved-only.
- No existing policy was disabled or modified.

## Backup status

The Supabase MCP exposed no backup/snapshot operation and no existing Supabase Branch. No paid Branch was created. No DDL/DML has been executed in Production as of this record.
