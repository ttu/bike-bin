-- Geocode cache table: caches Nominatim results to avoid redundant API calls
-- Used by the geocode-postcode Edge Function

CREATE TABLE geocode_cache (
  postcode TEXT PRIMARY KEY,
  country TEXT NOT NULL DEFAULT '',
  area_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT now()
);

-- Allow the Edge Function (service role) to read/write the cache
-- No RLS needed since this is a server-only cache table
COMMENT ON TABLE geocode_cache IS 'Cache for geocoded postcode results from Nominatim API';
