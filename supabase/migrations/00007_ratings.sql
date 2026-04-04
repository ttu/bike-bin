-- ============================================================
-- Ratings: table, RLS
-- ============================================================

CREATE TYPE transaction_type AS ENUM ('borrow', 'donate', 'sell');

-- Ratings
CREATE TABLE ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  text text,
  editable_until timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_ratings_to_user ON ratings(to_user_id);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings_select_public"
  ON ratings FOR SELECT
  USING (true);

-- Require a completed borrow transaction to create a rating
CREATE POLICY "ratings_insert_verified"
  ON ratings FOR INSERT
  WITH CHECK (
    (select auth.uid()) = from_user_id
    AND from_user_id != to_user_id
    AND EXISTS (
      SELECT 1 FROM borrow_requests br
      JOIN items ON items.id = br.item_id
      WHERE br.status = 'returned'
        AND (
          (br.requester_id = from_user_id AND items.owner_id = to_user_id)
          OR
          (items.owner_id = from_user_id AND br.requester_id = to_user_id)
        )
        AND (item_id IS NULL OR br.item_id = item_id)
    )
  );

CREATE POLICY "ratings_update_own"
  ON ratings FOR UPDATE
  USING (
    (select auth.uid()) = from_user_id
    AND (editable_until IS NULL OR editable_until > now())
  )
  WITH CHECK ((select auth.uid()) = from_user_id);

CREATE POLICY "ratings_delete_own"
  ON ratings FOR DELETE
  USING ((select auth.uid()) = from_user_id);

-- ============================================================
-- Trigger: recalculate profile rating aggregates
-- ============================================================

CREATE OR REPLACE FUNCTION update_user_rating_avg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.to_user_id;
  ELSE
    target_user_id := NEW.to_user_id;
  END IF;

  UPDATE profiles
  SET
    rating_avg = COALESCE(
      (SELECT AVG(score) FROM ratings WHERE to_user_id = target_user_id),
      0
    ),
    rating_count = (SELECT COUNT(*) FROM ratings WHERE to_user_id = target_user_id),
    updated_at = now()
  WHERE id = target_user_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_user_rating_avg
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating_avg();


