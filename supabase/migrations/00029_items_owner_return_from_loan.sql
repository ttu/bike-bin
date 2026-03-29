-- Owners could not mark loaned items as returned: items_update_own blocks status IN ('loaned', 'reserved').
-- Allow release to stored (loaned/reserved -> stored). Permissive RLS OR-combines WITH CHECK across policies,
-- so a trigger blocks any other change while status stays loaned or reserved.

CREATE POLICY "items_update_owner_release_borrow_lock"
  ON items FOR UPDATE
  USING (auth.uid() = owner_id AND status IN ('loaned', 'reserved'))
  WITH CHECK (auth.uid() = owner_id AND status = 'stored');

CREATE OR REPLACE FUNCTION enforce_item_no_edits_while_borrow_locked()
RETURNS trigger AS $$
DECLARE
  old_j jsonb;
  new_j jsonb;
BEGIN
  IF OLD.status IN ('loaned', 'reserved') AND NEW.status = OLD.status THEN
    old_j := to_jsonb(OLD) - 'updated_at';
    new_j := to_jsonb(NEW) - 'updated_at';
    IF old_j IS DISTINCT FROM new_j THEN
      RAISE EXCEPTION 'Borrow-locked items may only change when releasing to stored';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_items_enforce_borrow_locked_update
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION enforce_item_no_edits_while_borrow_locked();
