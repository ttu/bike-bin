-- ============================================================
-- Ratings: table, RLS
-- ============================================================

CREATE TYPE transaction_type AS ENUM ('borrow', 'donate', 'sell');

-- Ratings
-- from_user_id / to_user_id may be NULL after GDPR account deletion (anonymization).
CREATE TABLE ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  to_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
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

CREATE OR REPLACE FUNCTION public.recalc_user_rating_aggregate(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF target_user_id IS NULL THEN
    RETURN;
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
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_rating_avg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_user_rating_aggregate(OLD.to_user_id);
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.recalc_user_rating_aggregate(NEW.to_user_id);
    RETURN NEW;
  ELSE
    -- Always recalc on UPDATE (score may have changed)
    PERFORM public.recalc_user_rating_aggregate(NEW.to_user_id);
    IF OLD.to_user_id IS DISTINCT FROM NEW.to_user_id THEN
      PERFORM public.recalc_user_rating_aggregate(OLD.to_user_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_update_user_rating_avg
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating_avg();

CREATE TRIGGER trg_ratings_set_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


