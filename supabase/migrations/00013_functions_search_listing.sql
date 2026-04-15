-- ============================================================
-- FUNCTIONS: Search and Listing RPCs
-- ============================================================

-- Listing detail: single item with owner profile, area name, distance
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
  quantity integer,
  created_at timestamptz,
  updated_at timestamptz,
  distance_meters float,
  area_name text,
  owner_display_name text,
  owner_avatar_url text,
  owner_rating_avg numeric,
  owner_rating_count integer,
  group_id uuid,
  group_name text,
  group_rating_avg numeric,
  group_rating_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
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
    i.quantity,
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
    COALESCE(p.rating_count, 0) AS owner_rating_count,
    i.group_id,
    g.name AS group_name,
    COALESCE(g.rating_avg, 0) AS group_rating_avg,
    COALESCE(g.rating_count, 0) AS group_rating_count
  FROM items i
  LEFT JOIN saved_locations sl ON sl.id = i.pickup_location_id
  LEFT JOIN public_profiles p ON p.id = i.owner_id
  LEFT JOIN groups g ON g.id = i.group_id
  LEFT JOIN LATERAL (
    SELECT loc.coordinates
    FROM saved_locations loc
    WHERE loc.user_id = (select auth.uid()) AND loc.is_primary = true
    LIMIT 1
  ) caller_loc ON true
  WHERE i.id = p_item_id
    -- Non-owners cannot view archived, donated, or sold items
    AND (
      (i.owner_id IS NOT NULL AND i.owner_id = (select auth.uid()))
      OR (i.group_id IS NOT NULL AND public.is_group_admin(i.group_id, (select auth.uid())))
      OR i.status NOT IN ('archived', 'donated', 'sold')
    )
    AND (
      i.visibility = 'all'
      OR (i.owner_id IS NOT NULL AND i.owner_id = (select auth.uid()))
      OR (i.group_id IS NOT NULL AND public.is_group_admin(i.group_id, (select auth.uid())))
      OR (
        i.group_id IS NOT NULL
        AND i.visibility = 'groups'
        AND public.is_group_member(i.group_id, (select auth.uid()))
      )
      OR (
        i.owner_id IS NOT NULL
        AND i.visibility = 'groups'
        AND public.user_shares_group_with_item(i.id, (select auth.uid()))
      )
    );
END;
$$;

-- Search nearby items (authenticated only)
CREATE OR REPLACE FUNCTION search_nearby_items(
  query text DEFAULT NULL,
  lat float DEFAULT NULL,
  lng float DEFAULT NULL,
  max_distance_meters int DEFAULT 10000,
  p_categories item_category[] DEFAULT NULL,
  p_conditions item_condition[] DEFAULT NULL,
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
  quantity integer,
  created_at timestamptz,
  updated_at timestamptz,
  distance_meters float
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
BEGIN
  IF (select auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'search requires authentication'
      USING ERRCODE = '42501';
  END IF;

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
    i.quantity,
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
    -- Exclude the caller's own items: personal items they own, or group items in groups they admin
    (
      (i.owner_id IS NOT NULL AND i.owner_id != (select auth.uid()))
      OR (i.group_id IS NOT NULL AND NOT public.is_group_admin(i.group_id, (select auth.uid())))
    )
    AND i.status NOT IN ('archived', 'donated', 'sold')
    AND (
      i.visibility = 'all'
      OR (
        i.visibility = 'groups'
        AND i.owner_id IS NOT NULL
        AND public.user_shares_group_with_item(i.id, (select auth.uid()))
      )
      OR (
        i.visibility = 'groups'
        AND i.group_id IS NOT NULL
        AND public.is_group_member(i.group_id, (select auth.uid()))
      )
    )
    AND (
      query IS NULL
      OR i.name ILIKE '%' || query || '%'
      OR i.brand ILIKE '%' || query || '%'
      OR i.model ILIKE '%' || query || '%'
      OR i.description ILIKE '%' || query || '%'
    )
    AND (p_categories IS NULL OR i.category = ANY(p_categories))
    AND (p_conditions IS NULL OR i.condition = ANY(p_conditions))
    AND (p_status IS NULL OR i.status = p_status)
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

-- Restrict search to authenticated users only
REVOKE ALL ON FUNCTION public.search_nearby_items(text, float, float, int, item_category[], item_condition[], item_status, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_nearby_items(text, float, float, int, item_category[], item_condition[], item_status, int, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_nearby_items(text, float, float, int, item_category[], item_condition[], item_status, int, int) TO authenticated;

