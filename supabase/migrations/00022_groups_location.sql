-- ============================================================
-- Groups: add location (postcode, country, coordinates, area_name)
-- Required for new groups so group-owned items get a distance in search.
-- Pre-release, so existing rows are seeded with a default Berlin location
-- and then NOT NULL is enforced on coordinates.
-- ============================================================

ALTER TABLE groups
  ADD COLUMN postcode text,
  ADD COLUMN country text,
  ADD COLUMN area_name text,
  ADD COLUMN coordinates geography(Point, 4326);

-- Seed any existing rows with a placeholder location (Berlin Mitte) so we can
-- add a NOT NULL on coordinates. Safe because we are pre-release.
UPDATE groups
SET
  postcode = COALESCE(postcode, '10115'),
  country = COALESCE(country, 'de'),
  area_name = COALESCE(area_name, 'Berlin Mitte, Berlin, Germany'),
  coordinates = COALESCE(coordinates, ST_SetSRID(ST_MakePoint(13.3888, 52.5316), 4326)::geography)
WHERE coordinates IS NULL;

ALTER TABLE groups
  ALTER COLUMN coordinates SET NOT NULL;

CREATE INDEX idx_groups_coordinates ON groups USING GIST (coordinates);

COMMENT ON COLUMN groups.coordinates IS 'Group location used as the pickup location for group-owned items in search.';
COMMENT ON COLUMN groups.area_name IS 'Human-readable area for the group location, derived from postcode geocoding.';
