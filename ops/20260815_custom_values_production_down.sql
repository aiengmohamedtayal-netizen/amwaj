BEGIN;

DROP TRIGGER IF EXISTS packages_business_option_reference_trg ON public.packages;
DROP TRIGGER IF EXISTS destinations_business_option_reference_trg ON public.destinations;
DROP TRIGGER IF EXISTS pricing_offers_business_option_reference_trg ON public.pricing_offers;

DROP FUNCTION IF EXISTS private.validate_business_option_reference();

ALTER TABLE public.packages DROP CONSTRAINT IF EXISTS packages_category_value_id_fkey;
ALTER TABLE public.destinations DROP CONSTRAINT IF EXISTS destinations_category_value_id_fkey;
ALTER TABLE public.pricing_offers DROP CONSTRAINT IF EXISTS pricing_offers_trip_style_value_id_fkey;

ALTER TABLE public.packages DROP COLUMN IF EXISTS category_value_id;
ALTER TABLE public.destinations DROP COLUMN IF EXISTS category_value_id;
ALTER TABLE public.pricing_offers DROP COLUMN IF EXISTS trip_style_value_id;

DROP POLICY IF EXISTS business_option_values_admin_all ON public.business_option_values;
DROP POLICY IF EXISTS business_option_values_public_read ON public.business_option_values;
DROP TABLE IF EXISTS public.business_option_values;

ALTER TABLE public.packages
  ADD CONSTRAINT packages_category_check CHECK (category IN ('vip', 'family', 'honeymoon'));
ALTER TABLE public.destinations
  ADD CONSTRAINT destinations_category_check CHECK (category IN ('egypt', 'international', 'umrah'));
ALTER TABLE public.pricing_offers
  ADD CONSTRAINT pricing_offers_trip_style_check CHECK (trip_style IN ('family', 'honeymoon', 'umrah', 'budget', 'vip', 'custom'));

COMMIT;
