-- Bike photos (mirrors item_photos structure)
CREATE TABLE bike_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id uuid NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_bike_photos_bike ON bike_photos(bike_id);

-- RLS
ALTER TABLE bike_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can see photos of bikes they can see (bikes are owner-only for now)
CREATE POLICY "bike_photos_select_own"
  ON bike_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bikes
      WHERE bikes.id = bike_photos.bike_id AND bikes.owner_id = auth.uid()
    )
  );

CREATE POLICY "bike_photos_insert_own"
  ON bike_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bikes
      WHERE bikes.id = bike_photos.bike_id AND bikes.owner_id = auth.uid()
    )
  );

CREATE POLICY "bike_photos_update_own"
  ON bike_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bikes
      WHERE bikes.id = bike_photos.bike_id AND bikes.owner_id = auth.uid()
    )
  );

CREATE POLICY "bike_photos_delete_own"
  ON bike_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bikes
      WHERE bikes.id = bike_photos.bike_id AND bikes.owner_id = auth.uid()
    )
  );
