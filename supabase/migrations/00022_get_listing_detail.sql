-- ============================================================
-- get_listing_detail
-- Returns a single item with owner profile, area name, and
-- distance from the caller's primary location.
-- SECURITY DEFINER so it can read saved_locations across users.
-- ============================================================
CREATE OR REPLACE FUNCTION get_listing_detail(
  p_item_id uuid
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
  distance_meters float,
  area_name text,
  owner_display_name text,
  owner_avatar_url text,
  owner_rating_avg numeric,
  owner_rating_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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
    -- Distance: from item's pickup location to caller's primary location
    CASE
      WHEN sl.coordinates IS NOT NULL AND caller_loc.coordinates IS NOT NULL
      THEN ST_Distance(sl.coordinates, caller_loc.coordinates)
      ELSE NULL
    END AS distance_meters,
    sl.area_name,
    p.display_name AS owner_display_name,
    p.avatar_url AS owner_avatar_url,
    COALESCE(p.rating_avg, 0) AS owner_rating_avg,
    COALESCE(p.rating_count, 0) AS owner_rating_count
  FROM items i
  LEFT JOIN saved_locations sl ON sl.id = i.pickup_location_id
  LEFT JOIN public_profiles p ON p.id = i.owner_id
  LEFT JOIN LATERAL (
    SELECT loc.coordinates
    FROM saved_locations loc
    WHERE loc.user_id = auth.uid() AND loc.is_primary = true
    LIMIT 1
  ) caller_loc ON true
  WHERE i.id = p_item_id
    -- Non-owners cannot view stored/archived items
    AND (i.owner_id = auth.uid() OR i.status NOT IN ('stored', 'archived'))
    AND (
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
    );
END;
$$;
