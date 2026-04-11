-- ============================================================
-- Bikes: tables, RLS (bikes + bike_photos)
-- Runs after profiles/saved_locations; before items (items.bike_id FK)
-- ============================================================

CREATE TYPE item_condition AS ENUM ('new', 'good', 'worn', 'broken');
CREATE TYPE bike_type AS ENUM ('road', 'gravel', 'mtb', 'city', 'touring', 'other');

-- Bikes
CREATE TABLE bikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  model text,
  type bike_type NOT NULL DEFAULT 'other',
  year integer,
  distance_km numeric,
  usage_hours numeric,
  condition item_condition NOT NULL DEFAULT 'good',
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON COLUMN bikes.distance_km IS 'Total distance ridden (kilometers), optional';
COMMENT ON COLUMN bikes.usage_hours IS 'Total usage hours (e.g. e-bike / suspension service tracking), optional';
COMMENT ON COLUMN bikes.condition IS 'Overall bike condition (same enum as items)';
COMMENT ON COLUMN bikes.notes IS 'Free-form owner notes';

CREATE INDEX idx_bikes_owner ON bikes(owner_id);

-- Bike photos
CREATE TABLE bike_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id uuid NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_bike_photos_bike ON bike_photos(bike_id);

ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bike_photos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: bikes
-- ============================================================

CREATE POLICY "bikes_select_own"
  ON bikes FOR SELECT
  USING ((select auth.uid()) = owner_id);

CREATE POLICY "bikes_insert_own"
  ON bikes FOR INSERT
  WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "bikes_update_own"
  ON bikes FOR UPDATE
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "bikes_delete_own"
  ON bikes FOR DELETE
  USING ((select auth.uid()) = owner_id);

-- ============================================================
-- RLS POLICIES: bike_photos
-- ============================================================

CREATE POLICY "bike_photos_select_own"
  ON bike_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bikes
      WHERE bikes.id = bike_photos.bike_id AND bikes.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "bike_photos_insert_own"
  ON bike_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bikes
      WHERE bikes.id = bike_photos.bike_id AND bikes.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "bike_photos_update_own"
  ON bike_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bikes
      WHERE bikes.id = bike_photos.bike_id AND bikes.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "bike_photos_delete_own"
  ON bike_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bikes
      WHERE bikes.id = bike_photos.bike_id AND bikes.owner_id = (select auth.uid())
    )
  );

CREATE TRIGGER trg_bikes_set_updated_at
  BEFORE UPDATE ON bikes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
