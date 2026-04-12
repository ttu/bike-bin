-- ============================================================
-- Group inventory RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION public.transfer_item_ownership(
  p_item_id uuid,
  p_to_owner_id uuid DEFAULT NULL,
  p_to_group_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_item items%ROWTYPE;
  v_caller uuid := (select auth.uid());
BEGIN
  IF num_nonnulls(p_to_owner_id, p_to_group_id) != 1 THEN
    RAISE EXCEPTION 'transfer_item_ownership: exactly one of p_to_owner_id / p_to_group_id required';
  END IF;

  SELECT * INTO v_item FROM items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'transfer_item_ownership: item % not found', p_item_id;
  END IF;

  -- Authorization: caller must own the item (personal) or be admin of the current group
  IF v_item.owner_id IS NOT NULL THEN
    IF v_item.owner_id != v_caller THEN
      RAISE EXCEPTION 'transfer_item_ownership: not authorized (not the item owner)';
    END IF;
  ELSIF v_item.group_id IS NOT NULL THEN
    IF NOT public.is_group_admin(v_item.group_id, v_caller) THEN
      RAISE EXCEPTION 'transfer_item_ownership: not authorized (not a group admin)';
    END IF;
  END IF;

  -- Personal -> Group: caller must be admin of target group
  IF p_to_group_id IS NOT NULL THEN
    IF NOT public.is_group_admin(p_to_group_id, v_caller) THEN
      RAISE EXCEPTION 'transfer_item_ownership: not authorized for target group';
    END IF;
  END IF;

  -- Group -> Personal: can only transfer to self
  IF p_to_owner_id IS NOT NULL THEN
    IF p_to_owner_id != v_caller THEN
      RAISE EXCEPTION 'transfer_item_ownership: can only transfer group items to yourself';
    END IF;
  END IF;

  -- No active borrows
  IF EXISTS (
    SELECT 1 FROM borrow_requests
    WHERE item_id = p_item_id AND status IN ('pending', 'accepted')
  ) THEN
    RAISE EXCEPTION 'transfer_item_ownership: cannot transfer item with active borrows';
  END IF;

  UPDATE items SET
    owner_id = p_to_owner_id,
    group_id = p_to_group_id,
    created_by = CASE WHEN p_to_group_id IS NOT NULL THEN v_caller ELSE NULL END,
    visibility = 'private',
    updated_at = now()
  WHERE id = p_item_id;

  DELETE FROM item_groups WHERE item_id = p_item_id;

  DELETE FROM conversation_participants
  WHERE conversation_id IN (
    SELECT id FROM conversations WHERE item_id = p_item_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_item_ownership(uuid, uuid, uuid) TO authenticated;
