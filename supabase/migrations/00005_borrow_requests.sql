-- ============================================================
-- Borrow requests: table, RLS
-- ============================================================

CREATE TYPE borrow_request_status AS ENUM ('pending', 'accepted', 'rejected', 'returned', 'cancelled');

-- Borrow requests
CREATE TABLE borrow_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status borrow_request_status NOT NULL DEFAULT 'pending',
  message text,
  acted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES profiles(id) ON DELETE RESTRICT,
  group_id uuid REFERENCES groups(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT borrow_requests_exclusive_owner
    CHECK (num_nonnulls(owner_id, group_id) = 1)
);

COMMENT ON COLUMN borrow_requests.acted_by IS 'For group-owned items: the admin who last transitioned status (auto-set by trigger). NULL for personal items.';
COMMENT ON COLUMN borrow_requests.owner_id IS 'Snapshot of items.owner_id at borrow request creation time. Immutable after insert.';
COMMENT ON COLUMN borrow_requests.group_id IS 'Snapshot of items.group_id at borrow request creation time. Immutable after insert.';

CREATE INDEX idx_borrow_requests_item ON borrow_requests(item_id);
CREATE INDEX idx_borrow_requests_requester ON borrow_requests(requester_id);

ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "borrow_requests_select"
  ON borrow_requests FOR SELECT
  USING (
    requester_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM items
      WHERE items.id = borrow_requests.item_id
        AND (
          (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
          OR (items.group_id IS NOT NULL AND public.is_group_admin(items.group_id, (select auth.uid())))
        )
    )
  );

CREATE POLICY "borrow_requests_insert"
  ON borrow_requests FOR INSERT
  WITH CHECK (
    (select auth.uid()) = requester_id
    -- Requester must be able to see the item (it exists and is listed/visible)
    AND EXISTS (
      SELECT 1 FROM items
      WHERE items.id = borrow_requests.item_id
    )
    -- Requester must not be the item owner or a group admin (no self-requests)
    AND NOT EXISTS (
      SELECT 1 FROM items
      WHERE items.id = borrow_requests.item_id
        AND (
          (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
          OR (items.group_id IS NOT NULL AND public.is_group_admin(items.group_id, (select auth.uid())))
        )
    )
  );

-- Borrow request update: status transition rules enforced by trigger
CREATE POLICY "borrow_requests_update"
  ON borrow_requests FOR UPDATE
  USING (
    requester_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM items
      WHERE items.id = borrow_requests.item_id
        AND (
          (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
          OR (items.group_id IS NOT NULL AND public.is_group_admin(items.group_id, (select auth.uid())))
        )
    )
  )
  WITH CHECK (
    requester_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM items
      WHERE items.id = borrow_requests.item_id
        AND (
          (items.owner_id IS NOT NULL AND items.owner_id = (select auth.uid()))
          OR (items.group_id IS NOT NULL AND public.is_group_admin(items.group_id, (select auth.uid())))
        )
    )
  );

-- ============================================================
-- Trigger: snapshot item ownership at borrow request creation
-- ============================================================

CREATE OR REPLACE FUNCTION borrow_requests_snapshot_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_item items%ROWTYPE;
BEGIN
  SELECT * INTO v_item FROM items WHERE id = NEW.item_id;
  NEW.owner_id := v_item.owner_id;
  NEW.group_id := v_item.group_id;
  NEW.acted_by := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_borrow_requests_snapshot_owner
  BEFORE INSERT ON borrow_requests
  FOR EACH ROW
  EXECUTE FUNCTION borrow_requests_snapshot_owner();

-- ============================================================
-- Trigger: borrow request status transition rules
-- ============================================================

CREATE OR REPLACE FUNCTION borrow_requests_enforce_update_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_item items%ROWTYPE;
  v_is_owner_or_admin boolean;
BEGIN
  IF OLD.item_id IS DISTINCT FROM NEW.item_id
     OR OLD.requester_id IS DISTINCT FROM NEW.requester_id THEN
    RAISE EXCEPTION 'borrow_requests: cannot change item_id or requester_id';
  END IF;

  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id
     OR OLD.group_id IS DISTINCT FROM NEW.group_id THEN
    RAISE EXCEPTION 'borrow_requests: cannot change ownership snapshot (owner_id, group_id)';
  END IF;

  IF OLD.status IN ('rejected', 'returned', 'cancelled') AND OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'borrow_requests: cannot change status from terminal state %', OLD.status;
  END IF;

  -- Reject direct client writes to acted_by
  IF OLD.acted_by IS DISTINCT FROM NEW.acted_by THEN
    NEW.acted_by := OLD.acted_by;
  END IF;

  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_item FROM items WHERE id = NEW.item_id;

  v_is_owner_or_admin :=
    (v_item.owner_id IS NOT NULL AND v_item.owner_id = (select auth.uid()))
    OR (v_item.group_id IS NOT NULL AND public.is_group_admin(v_item.group_id, (select auth.uid())));

  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    IF NOT v_is_owner_or_admin THEN
      RAISE EXCEPTION 'borrow_requests: only item owner or group admin may accept or reject';
    END IF;
    IF v_item.group_id IS NOT NULL THEN
      NEW.acted_by := (select auth.uid());
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
    IF OLD.requester_id IS DISTINCT FROM (select auth.uid()) THEN
      RAISE EXCEPTION 'borrow_requests: only requester may cancel a pending request';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'accepted' AND NEW.status = 'returned' THEN
    IF NOT v_is_owner_or_admin THEN
      RAISE EXCEPTION 'borrow_requests: only item owner or group admin may mark returned';
    END IF;
    IF v_item.group_id IS NOT NULL THEN
      NEW.acted_by := (select auth.uid());
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'accepted' AND NEW.status = 'cancelled' THEN
    IF OLD.requester_id IS DISTINCT FROM (select auth.uid()) THEN
      RAISE EXCEPTION 'borrow_requests: only requester may cancel an accepted request';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'borrow_requests: invalid status transition from % to %', OLD.status, NEW.status;
END;
$$;

CREATE TRIGGER trg_borrow_requests_enforce_update_rules
  BEFORE UPDATE ON borrow_requests
  FOR EACH ROW
  EXECUTE FUNCTION borrow_requests_enforce_update_rules();


