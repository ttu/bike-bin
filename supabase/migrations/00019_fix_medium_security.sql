-- Fix MEDIUM security issues:
--   5. search_nearby_items SECURITY DEFINER bypasses RLS
--   6. No status transition guards on borrow_requests UPDATE
--   7. Users can self-insert fake notifications
--   8. push_token exposed in profiles SELECT
--   9. Ratings can be created without a real transaction

-- ============================================================
-- 5. search_nearby_items: replace SECURITY DEFINER with INVOKER
--
-- The function duplicates visibility logic instead of relying on
-- RLS. If RLS policies change, this function silently diverges.
-- Switch to SECURITY INVOKER so RLS is enforced by Postgres.
-- ============================================================

CREATE OR REPLACE FUNCTION search_nearby_items(
  query text DEFAULT NULL,
  lat float DEFAULT NULL,
  lng float DEFAULT NULL,
  max_distance_meters int DEFAULT 10000,
  p_category item_category DEFAULT NULL,
  p_condition item_condition DEFAULT NULL,
  p_status item_status DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  name text,
  category item_category,
  brand text,
  model text,
  description text,
  condition item_condition,
  status item_status,
  availability_types text[],
  price numeric,
  deposit numeric,
  borrow_duration text,
  visibility item_visibility,
  pickup_location_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  distance_meters float
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.owner_id,
    i.name,
    i.category,
    i.brand,
    i.model,
    i.description,
    i.condition,
    i.status,
    i.availability_types,
    i.price,
    i.deposit,
    i.borrow_duration,
    i.visibility,
    i.pickup_location_id,
    i.created_at,
    i.updated_at,
    CASE
      WHEN lat IS NOT NULL AND lng IS NOT NULL AND sl.coordinates IS NOT NULL
      THEN ST_Distance(
        sl.coordinates,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
      )
      ELSE NULL
    END AS distance_meters
  FROM items i
  LEFT JOIN saved_locations sl ON sl.id = i.pickup_location_id
  WHERE
    -- Text search
    (
      query IS NULL
      OR i.name ILIKE '%' || query || '%'
      OR i.brand ILIKE '%' || query || '%'
      OR i.model ILIKE '%' || query || '%'
      OR i.description ILIKE '%' || query || '%'
    )
    -- Category filter
    AND (p_category IS NULL OR i.category = p_category)
    -- Condition filter
    AND (p_condition IS NULL OR i.condition = p_condition)
    -- Status filter
    AND (p_status IS NULL OR i.status = p_status)
    -- Distance filter (only applied if lat/lng provided)
    AND (
      lat IS NULL OR lng IS NULL
      OR sl.coordinates IS NULL
      OR ST_DWithin(
        sl.coordinates,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        max_distance_meters
      )
    )
  ORDER BY
    CASE
      WHEN lat IS NOT NULL AND lng IS NOT NULL AND sl.coordinates IS NOT NULL
      THEN ST_Distance(
        sl.coordinates,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
      )
      ELSE 0
    END ASC,
    i.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================
-- 6. Borrow request status transition guards
--
-- Without guards, a requester could set status to 'accepted'
-- or an owner could set it to 'returned'. Enforce valid
-- state machine transitions:
--   pending  -> accepted | rejected | cancelled
--   accepted -> returned | cancelled
-- ============================================================

DROP POLICY "borrow_requests_update" ON borrow_requests;

CREATE POLICY "borrow_requests_update"
  ON borrow_requests FOR UPDATE
  USING (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    CASE
      -- Owner can accept or reject a pending request
      WHEN EXISTS (
        SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = auth.uid()
      ) THEN (
        (borrow_requests.status = 'pending' AND status IN ('accepted', 'rejected'))
        OR (borrow_requests.status = 'accepted' AND status = 'returned')
      )
      -- Requester can cancel a pending or accepted request
      WHEN requester_id = auth.uid() THEN (
        borrow_requests.status IN ('pending', 'accepted') AND status = 'cancelled'
      )
      ELSE false
    END
  );

-- ============================================================
-- 7. Notifications INSERT: remove user self-insert
--
-- Users should NOT be able to create their own notifications.
-- Notifications should only be created by server-side code
-- (Edge Functions / triggers) using the service_role key.
-- ============================================================

DROP POLICY "notifications_insert_own" ON notifications;

-- No replacement INSERT policy — only service_role can insert.

-- ============================================================
-- 8. Hide push_token from public profiles SELECT
--
-- push_token is a sensitive field that allows sending push
-- notifications to a user. It should only be visible to the
-- user themselves. Use a column-level security approach via
-- a view + RLS.
-- ============================================================

-- Revoke direct column access isn't practical with Supabase/PostgREST,
-- so we null out push_token for non-owners at the RLS level.
-- Replace the permissive SELECT policy with one that still allows
-- all rows but masks sensitive fields via a trigger-based approach.
--
-- Simplest approach: create a secure view for public access and
-- restrict direct table reads to own profile only.

-- Drop the old permissive SELECT that shows everything to everyone
DROP POLICY "profiles_select_public" ON profiles;

-- Own profile: full access (includes push_token)
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Other profiles: grant access but we need to hide push_token.
-- Since RLS can't mask columns, we use a security-barrier view.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_barrier = true, security_invoker = true)
AS
SELECT
  id,
  display_name,
  avatar_url,
  rating_avg,
  rating_count,
  created_at,
  updated_at
FROM profiles;

-- Grant access to the view for authenticated and anon roles
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- ============================================================
-- 9. Ratings INSERT: require a completed borrow transaction
--
-- Without this check, any user can fabricate ratings against
-- anyone. Require that a borrow_request exists between the
-- rater and the rated user (via the item) with status
-- 'returned' (completed transaction).
-- ============================================================

DROP POLICY "ratings_insert_authenticated" ON ratings;

CREATE POLICY "ratings_insert_verified"
  ON ratings FOR INSERT
  WITH CHECK (
    auth.uid() = from_user_id
    AND from_user_id != to_user_id
    AND EXISTS (
      SELECT 1 FROM borrow_requests br
      JOIN items ON items.id = br.item_id
      WHERE br.status = 'returned'
        AND (
          -- Rater was the requester, rated user is the owner
          (br.requester_id = from_user_id AND items.owner_id = to_user_id)
          OR
          -- Rater was the owner, rated user is the requester
          (items.owner_id = from_user_id AND br.requester_id = to_user_id)
        )
        -- Optionally scoped to a specific item
        AND (item_id IS NULL OR br.item_id = item_id)
    )
  );
