-- ============================================================
-- 1. search_nearby_items
-- Finds items near a given lat/lng within max_distance_meters.
-- Joins with saved_locations on pickup_location_id for distance calc.
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
SECURITY DEFINER
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
    -- Visibility: only publicly visible items or own items
    (
      i.visibility = 'all'
      OR i.owner_id = auth.uid()
      OR (
        i.visibility = 'groups'
        AND EXISTS (
          SELECT 1 FROM item_groups ig
          JOIN group_members gm ON gm.group_id = ig.group_id
          WHERE ig.item_id = i.id AND gm.user_id = auth.uid()
        )
      )
    )
    -- Text search
    AND (
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
-- 2. update_user_rating_avg
-- Trigger function: recalculates rating_avg and rating_count
-- on profiles whenever a rating is inserted, updated, or deleted.
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_rating_avg()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Determine which user's rating to recalculate
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

-- Trigger: fires after any INSERT, UPDATE, or DELETE on ratings
CREATE TRIGGER trg_update_user_rating_avg
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating_avg();

-- ============================================================
-- 3. create_profile_on_signup
-- Trigger function: auto-creates a profiles row when a new
-- auth.users record is inserted (e.g. on user sign-up).
-- ============================================================
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger: fires after INSERT on auth.users
CREATE TRIGGER trg_create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_on_signup();
