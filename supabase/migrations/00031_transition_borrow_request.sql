-- Atomically transition a borrow request and its associated item status.
-- This replaces the two-step client-side mutation that could leave data
-- in an inconsistent state if the second update failed.
CREATE OR REPLACE FUNCTION transition_borrow_request(
  p_request_id UUID,
  p_new_request_status TEXT,
  p_new_item_status TEXT
) RETURNS JSONB AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Update the borrow request status
  UPDATE borrow_requests
  SET status = p_new_request_status::borrow_request_status, updated_at = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Borrow request % not found', p_request_id;
  END IF;

  -- Update the associated item status
  UPDATE items
  SET status = p_new_item_status::item_status
  WHERE id = v_request.item_id;

  RETURN to_jsonb(v_request);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
