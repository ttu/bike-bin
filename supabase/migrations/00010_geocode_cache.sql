-- ============================================================
-- Geocode cache: table, RLS
-- ============================================================

-- TABLES: geocode cache
-- ============================================================

-- Geocode cache (server-only; explicit deny policies for anon/authenticated below)
CREATE TABLE geocode_cache (
  postcode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  area_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (postcode, country)
);

-- Normalize postcode/country on write so the composite PK always
-- holds canonical (trimmed, lowercased) values.
CREATE OR REPLACE FUNCTION public.normalize_geocode_cache_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  NEW.postcode := lower(trim(NEW.postcode));
  NEW.country  := lower(trim(NEW.country));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_geocode_cache_normalize_key
  BEFORE INSERT OR UPDATE ON geocode_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_geocode_cache_key();

COMMENT ON TABLE geocode_cache IS 'Cache for geocoded postcode results from Nominatim API';

ALTER TABLE geocode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "geocode_cache_deny_authenticated_and_anon"
  ON public.geocode_cache
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);


