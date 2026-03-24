-- Add tags array column to items
ALTER TABLE items ADD COLUMN tags text[] NOT NULL DEFAULT '{}';

-- Constraints
ALTER TABLE items ADD CONSTRAINT items_tags_max_count
  CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 20);
ALTER TABLE items ADD CONSTRAINT items_tags_no_empty
  CHECK ('' != ALL(tags));

-- Trigger-based constraint for per-element max length (subqueries not allowed in CHECK)
CREATE OR REPLACE FUNCTION check_tags_max_length()
RETURNS trigger AS $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY NEW.tags LOOP
    IF length(t) > 50 THEN
      RAISE EXCEPTION 'tag too long: max 50 characters';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_items_tags_max_length
  BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION check_tags_max_length();

-- GIN index for array containment queries
CREATE INDEX idx_items_tags ON items USING GIN (tags);

-- RPC function for autocomplete (unnest not available via Supabase JS client)
CREATE OR REPLACE FUNCTION get_user_tags()
RETURNS SETOF text AS $$
  SELECT DISTINCT unnest(tags) FROM items WHERE owner_id = auth.uid()
  ORDER BY 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public;
