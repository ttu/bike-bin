-- ============================================================
-- FUNCTIONS: Business Logic (RPCs; trigger bodies live in domain migrations)
-- ============================================================

-- Tag autocomplete RPC
-- Returns tags from items the caller owns personally OR from groups they admin.
CREATE OR REPLACE FUNCTION get_user_tags()
RETURNS SETOF text AS $$
  SELECT DISTINCT unnest(tags) FROM items
  WHERE (owner_id IS NOT NULL AND owner_id = (select auth.uid()))
     OR (group_id IS NOT NULL AND private.is_group_admin(group_id, (select auth.uid())))
  ORDER BY 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path TO public, pg_temp;

REVOKE ALL ON FUNCTION get_user_tags() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_user_tags() TO authenticated;

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
SET search_path TO public, pg_temp
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

-- Atomically transition a borrow request and its associated item status.
-- Verifies the caller is the item owner or the requester before proceeding.
-- The borrow_requests trigger enforces the state-machine rules; this function
-- additionally guards the item status update (which has no trigger guard).
-- NOTE: p_new_item_status is accepted for API compatibility but the actual
-- item status is derived server-side. A mismatch raises an error so callers
-- notice stale mappings early.
-- Follow-up: the p_new_item_status parameter is redundant (server derives it)
-- and should be removed end-to-end once all clients stop passing it (requires
-- coordinated app-code + generated-types update).
CREATE OR REPLACE FUNCTION transition_borrow_request(
  p_request_id UUID,
  p_new_request_status TEXT,
  p_new_item_status TEXT
) RETURNS JSONB AS $$
DECLARE
  v_request RECORD;
  v_caller UUID := (select auth.uid());
  v_derived_item_status item_status;
BEGIN
  -- Single authorized fetch: only returns a row if the caller is the
  -- requester or item owner, so we don't leak request existence.
  SELECT br.*, i.owner_id AS item_owner_id
  INTO v_request
  FROM borrow_requests br
  JOIN items i ON i.id = br.item_id
  WHERE br.id = p_request_id
    AND (br.requester_id = v_caller OR i.owner_id = v_caller)
  FOR UPDATE OF br, i;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Borrow request not found or not accessible'
      USING ERRCODE = '42501';
  END IF;

  -- Derive the new item status from the request status transition (server-side)
  v_derived_item_status := CASE p_new_request_status
    WHEN 'accepted' THEN 'loaned'::item_status
    WHEN 'rejected' THEN 'stored'::item_status
    WHEN 'returned' THEN 'stored'::item_status
    WHEN 'cancelled' THEN 'stored'::item_status
    ELSE NULL
  END;

  IF v_derived_item_status IS NULL THEN
    RAISE EXCEPTION 'No item status mapping for request status %', p_new_request_status;
  END IF;

  -- Warn callers passing a stale/wrong item status so they can update client code
  IF p_new_item_status IS NOT NULL
     AND p_new_item_status <> v_derived_item_status::text THEN
    RAISE EXCEPTION 'p_new_item_status mismatch: caller sent ''%'' but server derived ''%'' — update client code',
      p_new_item_status, v_derived_item_status::text;
  END IF;

  -- Transition the borrow request (trigger validates state-machine rules)
  UPDATE borrow_requests
  SET status = p_new_request_status::borrow_request_status, updated_at = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  -- Update item status (server-derived, not client-supplied)
  UPDATE items
  SET status = v_derived_item_status, updated_at = NOW()
  WHERE id = v_request.item_id;

  RETURN to_jsonb(v_request);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_temp;

REVOKE ALL ON FUNCTION transition_borrow_request(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION transition_borrow_request(UUID, TEXT, TEXT) TO authenticated;
