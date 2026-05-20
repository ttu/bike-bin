-- ============================================================
-- Borrow: three-step lifecycle
--   accept    : item stored   -> reserved (was: stored -> loaned)
--   pickup    : item reserved -> loaned   (new transition)
--   return    : item loaned   -> stored   (was: loaned -> stored, but only from accepted)
--
-- Also update the items borrow-lock guard to allow reserved -> loaned
-- (handoff step in the new lifecycle).
-- ============================================================

-- Allow reserved -> loaned transition (pickup step) in the items borrow-lock guard.
-- Previously only stored was allowed as the release target.
CREATE OR REPLACE FUNCTION enforce_item_no_edits_while_borrow_locked()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  old_j jsonb;
  new_j jsonb;
BEGIN
  IF OLD.status IN ('loaned', 'reserved') AND NEW.status = OLD.status THEN
    old_j := to_jsonb(OLD) - 'updated_at' - 'search_vector';
    new_j := to_jsonb(NEW) - 'updated_at' - 'search_vector';
    IF old_j IS DISTINCT FROM new_j THEN
      RAISE EXCEPTION 'Borrow-locked items may only change when releasing to stored';
    END IF;
  ELSIF OLD.status = 'reserved' AND NEW.status = 'loaned' THEN
    -- Allowed: pickup step transitions reserved -> loaned
    NULL;
  ELSIF OLD.status IN ('loaned', 'reserved') AND NEW.status IS DISTINCT FROM 'stored' THEN
    RAISE EXCEPTION 'Borrow-locked items may only be released to stored';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION borrow_requests_enforce_update_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_item items%ROWTYPE;
  v_is_owner_or_admin boolean;
  status_pending    constant borrow_request_status := 'pending';
  status_accepted   constant borrow_request_status := 'accepted';
  status_picked_up  constant borrow_request_status := 'picked_up';
  status_rejected   constant borrow_request_status := 'rejected';
  status_returned   constant borrow_request_status := 'returned';
  status_cancelled  constant borrow_request_status := 'cancelled';
BEGIN
  IF OLD.item_id IS DISTINCT FROM NEW.item_id
     OR OLD.requester_id IS DISTINCT FROM NEW.requester_id THEN
    RAISE EXCEPTION 'borrow_requests: cannot change item_id or requester_id';
  END IF;

  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id
     OR OLD.group_id IS DISTINCT FROM NEW.group_id THEN
    RAISE EXCEPTION 'borrow_requests: cannot change ownership snapshot';
  END IF;

  IF OLD.status IN (status_rejected, status_returned, status_cancelled)
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'borrow_requests: cannot change status from terminal state %', OLD.status;
  END IF;

  IF OLD.acted_by IS DISTINCT FROM NEW.acted_by THEN
    NEW.acted_by := OLD.acted_by;
  END IF;

  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_item FROM items WHERE id = NEW.item_id;

  v_is_owner_or_admin :=
    (v_item.owner_id IS NOT NULL AND v_item.owner_id = (select auth.uid()))
    OR (v_item.group_id IS NOT NULL AND private.is_group_admin(v_item.group_id, (select auth.uid())));

  -- pending -> accepted | rejected: owner/admin
  IF OLD.status = status_pending AND NEW.status IN (status_accepted, status_rejected) THEN
    IF NOT v_is_owner_or_admin THEN
      RAISE EXCEPTION 'borrow_requests: only item owner or group admin may accept or reject';
    END IF;
    IF v_item.group_id IS NOT NULL THEN NEW.acted_by := (select auth.uid()); END IF;
    RETURN NEW;
  END IF;

  -- pending -> cancelled: requester
  IF OLD.status = status_pending AND NEW.status = status_cancelled THEN
    IF OLD.requester_id IS DISTINCT FROM (select auth.uid()) THEN
      RAISE EXCEPTION 'borrow_requests: only requester may cancel a pending request';
    END IF;
    RETURN NEW;
  END IF;

  -- accepted -> picked_up: owner/admin
  IF OLD.status = status_accepted AND NEW.status = status_picked_up THEN
    IF NOT v_is_owner_or_admin THEN
      RAISE EXCEPTION 'borrow_requests: only item owner or group admin may mark picked up';
    END IF;
    IF v_item.group_id IS NOT NULL THEN NEW.acted_by := (select auth.uid()); END IF;
    RETURN NEW;
  END IF;

  -- accepted -> cancelled: requester OR owner/admin (handoff fell through)
  IF OLD.status = status_accepted AND NEW.status = status_cancelled THEN
    IF (select auth.uid()) IS DISTINCT FROM OLD.requester_id AND NOT v_is_owner_or_admin THEN
      RAISE EXCEPTION 'borrow_requests: only requester or owner may cancel an accepted request';
    END IF;
    IF v_item.group_id IS NOT NULL AND v_is_owner_or_admin THEN NEW.acted_by := (select auth.uid()); END IF;
    RETURN NEW;
  END IF;

  -- picked_up -> returned: owner/admin
  IF OLD.status = status_picked_up AND NEW.status = status_returned THEN
    IF NOT v_is_owner_or_admin THEN
      RAISE EXCEPTION 'borrow_requests: only item owner or group admin may mark returned';
    END IF;
    IF v_item.group_id IS NOT NULL THEN NEW.acted_by := (select auth.uid()); END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'borrow_requests: invalid status transition from % to %', OLD.status, NEW.status;
END;
$$;

-- Replace RPC: map request status -> item status under new lifecycle
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
  SELECT br.*, i.owner_id AS item_owner_id
  INTO v_request
  FROM borrow_requests br
  JOIN items i ON i.id = br.item_id
  WHERE br.id = p_request_id
    AND (br.requester_id = v_caller OR i.owner_id = v_caller)
  FOR UPDATE OF br, i;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Borrow request not found or not accessible' USING ERRCODE = '42501';
  END IF;

  v_derived_item_status := CASE p_new_request_status
    WHEN 'accepted'  THEN 'reserved'::item_status
    WHEN 'picked_up' THEN 'loaned'::item_status
    WHEN 'returned'  THEN 'stored'::item_status
    WHEN 'rejected'  THEN 'stored'::item_status
    WHEN 'cancelled' THEN 'stored'::item_status
    ELSE NULL
  END;

  IF v_derived_item_status IS NULL THEN
    RAISE EXCEPTION 'No item status mapping for request status %', p_new_request_status;
  END IF;

  IF p_new_item_status IS NOT NULL
     AND p_new_item_status <> v_derived_item_status::text THEN
    RAISE EXCEPTION 'p_new_item_status mismatch: caller sent ''%'' but server derived ''%''',
      p_new_item_status, v_derived_item_status::text;
  END IF;

  UPDATE borrow_requests
  SET status = p_new_request_status::borrow_request_status, updated_at = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  UPDATE items
  SET status = v_derived_item_status, updated_at = NOW()
  WHERE id = v_request.item_id;

  RETURN to_jsonb(v_request);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_temp;

REVOKE ALL ON FUNCTION transition_borrow_request(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION transition_borrow_request(UUID, TEXT, TEXT) TO authenticated;
