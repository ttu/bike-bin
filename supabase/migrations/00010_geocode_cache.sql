-- ============================================================
-- Geocode cache: table, RLS
-- ============================================================

-- TABLES: geocode cache
-- ============================================================

-- Geocode cache (server-only; explicit deny policies for anon/authenticated below)
CREATE TABLE geocode_cache (
  postcode TEXT PRIMARY KEY,
  country TEXT NOT NULL DEFAULT '',
  area_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE geocode_cache IS 'Cache for geocoded postcode results from Nominatim API';

ALTER TABLE geocode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "geocode_cache_deny_authenticated_and_anon"
  ON public.geocode_cache
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);


