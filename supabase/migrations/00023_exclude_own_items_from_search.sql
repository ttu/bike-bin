-- Exclude the searching user's own items from search results.
-- Uses (auth.uid() IS NULL OR i.owner_id != auth.uid()) so that unauthenticated
-- users (auth.uid() = NULL) can still browse all public listings, per docs/security.md.
-- The dead-code visibility clause (OR i.owner_id = auth.uid()) is removed since
-- authenticated own items are now excluded before reaching that check.
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
    -- NULL guard: auth.uid() is NULL for unauthenticated users; NULL != x is NULL (falsy),
    -- so without this guard unauthenticated users would get zero results.
    (auth.uid() IS NULL OR i.owner_id != auth.uid())
    -- Visibility: publicly visible items, or group-shared items the user belongs to.
    -- Note: the previous "OR i.owner_id = auth.uid()" visibility clause has been removed
    -- because own items are now excluded above, making that branch unreachable.
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
