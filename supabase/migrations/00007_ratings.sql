-- ============================================================
-- Ratings: table, RLS
-- ============================================================

CREATE TYPE transaction_type AS ENUM ('borrow', 'donate', 'sell');

-- Ratings
-- from_user_id / to_user_id may be NULL after GDPR account deletion (anonymization).
-- Exclusive-arc: each rating targets either a user (to_user_id) or a group (to_group_id), never both.
CREATE TABLE ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  to_group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  text text,
  editable_until timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT ratings_exclusive_target
    CHECK (num_nonnulls(to_user_id, to_group_id) = 1)
);

CREATE INDEX idx_ratings_to_user ON ratings(to_user_id) WHERE to_user_id IS NOT NULL;
CREATE INDEX idx_ratings_to_group ON ratings(to_group_id) WHERE to_group_id IS NOT NULL;

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings_select_public"
  ON ratings FOR SELECT
  USING (true);

-- Require a completed borrow transaction to create a rating
CREATE POLICY "ratings_insert_verified"
  ON ratings FOR INSERT
  WITH CHECK (
    (select auth.uid()) = from_user_id
    AND (
      -- User-to-user rating: requires a completed borrow between the two parties
      (
        to_user_id IS NOT NULL
        AND from_user_id != to_user_id
        AND EXISTS (
          SELECT 1 FROM borrow_requests br
          JOIN items ON items.id = br.item_id
          WHERE br.status = 'returned'
            AND (
              (br.requester_id = from_user_id AND items.owner_id = to_user_id)
              OR (items.owner_id = from_user_id AND br.requester_id = to_user_id)
            )
            AND (item_id IS NULL OR br.item_id = item_id)
        )
      )
      -- User-to-group rating: requester rated the group after returning a group item
      OR (
        to_group_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM borrow_requests br
          JOIN items ON items.id = br.item_id
          WHERE br.status = 'returned'
            AND br.requester_id = from_user_id
            AND items.group_id = to_group_id
            AND (item_id IS NULL OR br.item_id = item_id)
        )
      )
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

CREATE OR REPLACE FUNCTION public.recalc_group_rating_aggregate(target_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF target_group_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE groups
  SET
    rating_avg = COALESCE(
      (SELECT AVG(score) FROM ratings WHERE to_group_id = target_group_id),
      0
    ),
    rating_count = (SELECT COUNT(*) FROM ratings WHERE to_group_id = target_group_id)
  WHERE id = target_group_id;
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
    PERFORM public.recalc_group_rating_aggregate(OLD.to_group_id);
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.recalc_user_rating_aggregate(NEW.to_user_id);
    PERFORM public.recalc_group_rating_aggregate(NEW.to_group_id);
    RETURN NEW;
  ELSE
    IF OLD.to_user_id IS DISTINCT FROM NEW.to_user_id THEN
      PERFORM public.recalc_user_rating_aggregate(OLD.to_user_id);
      PERFORM public.recalc_user_rating_aggregate(NEW.to_user_id);
    END IF;
    IF OLD.to_group_id IS DISTINCT FROM NEW.to_group_id THEN
      PERFORM public.recalc_group_rating_aggregate(OLD.to_group_id);
      PERFORM public.recalc_group_rating_aggregate(NEW.to_group_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_update_user_rating_avg
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating_avg();


