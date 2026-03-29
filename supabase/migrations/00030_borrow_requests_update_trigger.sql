-- borrow_requests UPDATE policy in 00019 used WITH CHECK conditions like
-- (borrow_requests.status = 'accepted' AND status = 'returned'). In PostgreSQL,
-- WITH CHECK sees only the NEW row, so borrow_requests.status is the new status,
-- not the old — accepted→returned always failed (403 from PostgREST).

CREATE OR REPLACE FUNCTION borrow_requests_enforce_update_rules()
RETURNS trigger AS $$
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
    IF NOT EXISTS (SELECT 1 FROM items WHERE id = NEW.item_id AND owner_id = auth.uid()) THEN
      RAISE EXCEPTION 'borrow_requests: only item owner may accept or reject';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
    IF OLD.requester_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'borrow_requests: only requester may cancel a pending request';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'accepted' AND NEW.status = 'returned' THEN
    IF NOT EXISTS (SELECT 1 FROM items WHERE id = NEW.item_id AND owner_id = auth.uid()) THEN
      RAISE EXCEPTION 'borrow_requests: only item owner may mark returned';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'accepted' AND NEW.status = 'cancelled' THEN
    IF OLD.requester_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'borrow_requests: only requester may cancel an accepted request';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'borrow_requests: invalid status transition from % to %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_borrow_requests_enforce_update_rules ON borrow_requests;
CREATE TRIGGER trg_borrow_requests_enforce_update_rules
  BEFORE UPDATE ON borrow_requests
  FOR EACH ROW
  EXECUTE FUNCTION borrow_requests_enforce_update_rules();

DROP POLICY IF EXISTS "borrow_requests_update" ON borrow_requests;

CREATE POLICY "borrow_requests_update"
  ON borrow_requests FOR UPDATE
  USING (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM items WHERE items.id = borrow_requests.item_id AND items.owner_id = auth.uid()
    )
  );
