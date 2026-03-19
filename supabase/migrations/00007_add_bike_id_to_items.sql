-- Add bike_id FK to items table for mounted parts tracking
ALTER TABLE items
  ADD COLUMN bike_id uuid REFERENCES bikes(id) ON DELETE SET NULL;

-- Index for efficient lookup of parts mounted on a bike
CREATE INDEX idx_items_bike_id ON items(bike_id) WHERE bike_id IS NOT NULL;
