-- ============================================================
-- FUNCTIONS: Business Logic (RPCs; trigger bodies live in domain migrations)
-- ============================================================

-- Tag autocomplete RPC
CREATE OR REPLACE FUNCTION get_user_tags()
RETURNS SETOF text AS $$
  SELECT DISTINCT unnest(tags) FROM items WHERE owner_id = (select auth.uid())
  ORDER BY 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public;

-- Get public profile (safe fields only, bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  rating_avg numeric,
  rating_count integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    p.rating_avg,
    p.rating_count,
    p.created_at
  FROM public.profiles p
  WHERE p.id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated, anon;

-- Atomically transition a borrow request and its associated item status
CREATE OR REPLACE FUNCTION transition_borrow_request(
  p_request_id UUID,
  p_new_request_status TEXT,
  p_new_item_status TEXT
) RETURNS JSONB AS $$
DECLARE
  v_request RECORD;
BEGIN
  UPDATE borrow_requests
  SET status = p_new_request_status::borrow_request_status, updated_at = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Borrow request % not found', p_request_id;
  END IF;

  UPDATE items
  SET status = p_new_item_status::item_status
  WHERE id = v_request.item_id;

  RETURN to_jsonb(v_request);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;
