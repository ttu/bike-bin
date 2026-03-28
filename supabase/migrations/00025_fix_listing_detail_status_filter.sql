-- Fix status filtering for search and listing detail.
--
-- Problem: get_listing_detail excluded 'stored' items for non-owners, but
-- 'stored' is the default status (item in storage, available). This caused
-- a 406 error when opening search results.
--
-- Both functions now consistently exclude only items that are gone or hidden:
-- archived, donated, sold. These statuses mean the item is no longer available.

-- 1. Fix get_listing_detail: exclude archived/donated/sold (not stored)
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
    -- Non-owners cannot view archived, donated, or sold items
    AND (i.owner_id = auth.uid() OR i.status NOT IN ('archived', 'donated', 'sold'))
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

-- 2. Also exclude archived/donated/sold from search results
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
    -- Exclude the searching user's own items.
    (auth.uid() IS NULL OR i.owner_id != auth.uid())
    -- Exclude items that are no longer available (archived, donated, sold).
    AND i.status NOT IN ('archived', 'donated', 'sold')
    -- Visibility: publicly visible items, or group-shared items the user belongs to.
    AND (
      i.visibility = 'all'
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
