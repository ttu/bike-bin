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
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_borrow_requests_item ON borrow_requests(item_id);
CREATE INDEX idx_borrow_requests_requester ON borrow_requests(requester_id);

ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "borrow_requests_select"
  ON borrow_requests FOR SELECT
  USING (
    requester_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "borrow_requests_insert"
  ON borrow_requests FOR INSERT
  WITH CHECK (
    (select auth.uid()) = requester_id
    AND NOT EXISTS (
      SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = (select auth.uid())
    )
  );

-- Borrow request update: status transition rules enforced by trigger
CREATE POLICY "borrow_requests_update"
  ON borrow_requests FOR UPDATE
  USING (
    requester_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    requester_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = (select auth.uid())
    )
  );

-- ============================================================
-- Trigger: borrow request status transition rules
-- ============================================================

CREATE OR REPLACE FUNCTION borrow_requests_enforce_update_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF OLD.item_id IS DISTINCT FROM NEW.item_id
     OR OLD.requester_id IS DISTINCT FROM NEW.requester_id THEN
    RAISE EXCEPTION 'borrow_requests: cannot change item_id or requester_id';
  END IF;

  IF OLD.status IN ('rejected', 'returned', 'cancelled') AND OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'borrow_requests: cannot change status from terminal state %', OLD.status;
  END IF;

  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    IF NOT EXISTS (SELECT 1 FROM items WHERE id = NEW.item_id AND owner_id = (select auth.uid())) THEN
      RAISE EXCEPTION 'borrow_requests: only item owner may accept or reject';
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
    IF NOT EXISTS (SELECT 1 FROM items WHERE id = NEW.item_id AND owner_id = (select auth.uid())) THEN
      RAISE EXCEPTION 'borrow_requests: only item owner may mark returned';
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


