BEGIN;

CREATE TABLE IF NOT EXISTS public.business_option_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key text NOT NULL CHECK (field_key IN ('package.category', 'destination.category', 'pricing.trip_style')),
  value_key text NOT NULL,
  normalized_label text NOT NULL,
  label_ar text NOT NULL CHECK (length(btrim(label_ar)) BETWEEN 1 AND 120),
  label_en text NOT NULL CHECK (length(btrim(label_en)) BETWEEN 1 AND 120),
  source text NOT NULL DEFAULT 'custom' CHECK (source IN ('system', 'custom')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_option_values_value_key_check CHECK (value_key = btrim(value_key) AND length(value_key) BETWEEN 1 AND 120),
  CONSTRAINT business_option_values_normalized_label_check CHECK (normalized_label = btrim(normalized_label) AND length(normalized_label) BETWEEN 1 AND 120),
  CONSTRAINT business_option_values_custom_sentinel_check CHECK (source = 'system' OR lower(value_key) NOT IN ('other', '__other__')),
  CONSTRAINT business_option_values_field_value_key_key UNIQUE (field_key, value_key),
  CONSTRAINT business_option_values_field_normalized_label_key UNIQUE (field_key, normalized_label)
);

CREATE INDEX IF NOT EXISTS business_option_values_active_idx
  ON public.business_option_values (field_key, is_active, sort_order, label_ar);

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS category_value_id uuid;

ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS category_value_id uuid;

ALTER TABLE public.pricing_offers
  ADD COLUMN IF NOT EXISTS trip_style_value_id uuid;

INSERT INTO public.business_option_values (field_key, value_key, normalized_label, label_ar, label_en, source, is_active, sort_order)
VALUES
  ('package.category', 'vip', 'vip', 'VIP', 'VIP', 'system', true, 10),
  ('package.category', 'family', 'family', 'عائلي', 'Family', 'system', true, 20),
  ('package.category', 'honeymoon', 'honeymoon', 'شهر عسل', 'Honeymoon', 'system', true, 30),
  ('destination.category', 'egypt', 'egypt', 'داخل مصر', 'Egypt', 'system', true, 10),
  ('destination.category', 'international', 'international', 'دولية', 'International', 'system', true, 20),
  ('destination.category', 'umrah', 'umrah', 'عمرة', 'Umrah', 'system', true, 30),
  ('pricing.trip_style', 'family', 'family', 'عائلي', 'Family', 'system', true, 10),
  ('pricing.trip_style', 'honeymoon', 'honeymoon', 'شهر عسل', 'Honeymoon', 'system', true, 20),
  ('pricing.trip_style', 'umrah', 'umrah', 'عمرة', 'Umrah', 'system', true, 30),
  ('pricing.trip_style', 'budget', 'budget', 'اقتصادي', 'Budget', 'system', true, 40),
  ('pricing.trip_style', 'vip', 'vip', 'VIP', 'VIP', 'system', true, 50),
  ('pricing.trip_style', 'custom', 'custom', 'مخصص', 'Custom', 'system', true, 60)
ON CONFLICT (field_key, value_key) DO UPDATE
SET normalized_label = EXCLUDED.normalized_label,
    label_ar = CASE WHEN public.business_option_values.source = 'system' THEN EXCLUDED.label_ar ELSE public.business_option_values.label_ar END,
    label_en = CASE WHEN public.business_option_values.source = 'system' THEN EXCLUDED.label_en ELSE public.business_option_values.label_en END,
    is_active = CASE WHEN public.business_option_values.source = 'system' THEN true ELSE public.business_option_values.is_active END,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

UPDATE public.packages AS p
SET category_value_id = v.id
FROM public.business_option_values AS v
WHERE v.field_key = 'package.category'
  AND v.value_key = p.category
  AND p.category_value_id IS NULL;

UPDATE public.destinations AS d
SET category_value_id = v.id
FROM public.business_option_values AS v
WHERE v.field_key = 'destination.category'
  AND v.value_key = d.category
  AND d.category_value_id IS NULL;

UPDATE public.pricing_offers AS o
SET trip_style_value_id = v.id
FROM public.business_option_values AS v
WHERE v.field_key = 'pricing.trip_style'
  AND v.value_key = o.trip_style
  AND o.trip_style_value_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'packages_category_value_id_fkey') THEN
    ALTER TABLE public.packages
      ADD CONSTRAINT packages_category_value_id_fkey
      FOREIGN KEY (category_value_id) REFERENCES public.business_option_values(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'destinations_category_value_id_fkey') THEN
    ALTER TABLE public.destinations
      ADD CONSTRAINT destinations_category_value_id_fkey
      FOREIGN KEY (category_value_id) REFERENCES public.business_option_values(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pricing_offers_trip_style_value_id_fkey') THEN
    ALTER TABLE public.pricing_offers
      ADD CONSTRAINT pricing_offers_trip_style_value_id_fkey
      FOREIGN KEY (trip_style_value_id) REFERENCES public.business_option_values(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION private.validate_business_option_reference()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public, private
AS $$
DECLARE
  referenced public.business_option_values;
BEGIN
  IF TG_TABLE_NAME = 'packages' THEN
    IF NEW.category_value_id IS NULL THEN
      IF NEW.category NOT IN ('vip', 'family', 'honeymoon') THEN
        RAISE EXCEPTION 'package category requires an approved business option value';
      END IF;
    ELSE
      SELECT * INTO referenced
      FROM public.business_option_values
      WHERE id = NEW.category_value_id AND field_key = 'package.category'
      LIMIT 1;
      IF NOT FOUND OR referenced.value_key <> NEW.category THEN
        RAISE EXCEPTION 'package category and reference do not match';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'destinations' THEN
    IF NEW.category_value_id IS NULL THEN
      IF NEW.category NOT IN ('egypt', 'international', 'umrah') THEN
        RAISE EXCEPTION 'destination category requires an approved business option value';
      END IF;
    ELSE
      SELECT * INTO referenced
      FROM public.business_option_values
      WHERE id = NEW.category_value_id AND field_key = 'destination.category'
      LIMIT 1;
      IF NOT FOUND OR referenced.value_key <> NEW.category THEN
        RAISE EXCEPTION 'destination category and reference do not match';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'pricing_offers' THEN
    IF NEW.trip_style_value_id IS NULL THEN
      IF NEW.trip_style NOT IN ('family', 'honeymoon', 'umrah', 'budget', 'vip', 'custom') THEN
        RAISE EXCEPTION 'trip style requires an approved business option value';
      END IF;
    ELSE
      SELECT * INTO referenced
      FROM public.business_option_values
      WHERE id = NEW.trip_style_value_id AND field_key = 'pricing.trip_style'
      LIMIT 1;
      IF NOT FOUND OR referenced.value_key <> NEW.trip_style THEN
        RAISE EXCEPTION 'trip style and reference do not match';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS packages_business_option_reference_trg ON public.packages;
CREATE TRIGGER packages_business_option_reference_trg
BEFORE INSERT OR UPDATE OF category, category_value_id ON public.packages
FOR EACH ROW EXECUTE FUNCTION private.validate_business_option_reference();

DROP TRIGGER IF EXISTS destinations_business_option_reference_trg ON public.destinations;
CREATE TRIGGER destinations_business_option_reference_trg
BEFORE INSERT OR UPDATE OF category, category_value_id ON public.destinations
FOR EACH ROW EXECUTE FUNCTION private.validate_business_option_reference();

DROP TRIGGER IF EXISTS pricing_offers_business_option_reference_trg ON public.pricing_offers;
CREATE TRIGGER pricing_offers_business_option_reference_trg
BEFORE INSERT OR UPDATE OF trip_style, trip_style_value_id ON public.pricing_offers
FOR EACH ROW EXECUTE FUNCTION private.validate_business_option_reference();

ALTER TABLE public.packages DROP CONSTRAINT IF EXISTS packages_category_check;
ALTER TABLE public.destinations DROP CONSTRAINT IF EXISTS destinations_category_check;
ALTER TABLE public.pricing_offers DROP CONSTRAINT IF EXISTS pricing_offers_trip_style_check;

ALTER TABLE public.business_option_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS business_option_values_public_read ON public.business_option_values;
CREATE POLICY business_option_values_public_read
ON public.business_option_values
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS business_option_values_admin_all ON public.business_option_values;
CREATE POLICY business_option_values_admin_all
ON public.business_option_values
FOR ALL
TO authenticated
USING (private.is_admin())
WITH CHECK (private.is_admin());

COMMIT;
