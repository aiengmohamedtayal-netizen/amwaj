# Production Constraints Baseline

المصدر: استعلام قراءة على مشروع Supabase `wufguxedvhqechlqwoye` بتاريخ 2026-08-15. لم تُنفذ أي DDL أو DML ضمن هذه المرحلة.

## Package and destination taxonomy

`destinations_category_check`: category must be one of `egypt`, `international`, `umrah`.

`packages_category_check`: category must be one of `vip`, `family`, `honeymoon`.

## Existing protected checks

The following constraints were confirmed and must remain semantically intact: slug format and uniqueness for packages/destinations; status values (`draft`, `published` for packages/destinations and `draft`, `published`, `archived` for pricing offers); highlights must be JSON arrays; ratings must be between 0 and 5; non-negative sort orders; package price mode and price consistency; package and offer currency fixed to EGP; offer availability values (`available`, `limited`, `sold_out`); offer traveler bounds; monthly departure date must be the first day of the month; exactly one of package_id/service_id must be populated; offer price mode consistency; pricing unit fixed to `per_traveler`; sold-out seats consistency; non-negative seats.

## Existing foreign keys

`pricing_offers.destination_id` references `destinations(id)` with `ON DELETE RESTRICT`.

`pricing_offers.package_id` references `packages(id)` with `ON DELETE CASCADE`.

`pricing_offers.service_id` references `services(id)` with `ON DELETE CASCADE`.

## Taxonomy-specific migration implication

The current text CHECK constraints for package category, destination category, and pricing trip style prevent arbitrary custom labels. A safe Custom Values implementation must not silently bypass them. It requires a controlled compatibility design: preserve the existing text columns and their meaning, introduce reference IDs and a trusted resolver, and replace only the taxonomy CHECKs with a new referential/trigger validation that accepts seeded system values and approved custom records. Any such change must be transactionally applied and verified before code deployment; no unrelated constraints or foreign keys may be changed.
