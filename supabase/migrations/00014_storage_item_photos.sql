-- ============================================================
-- STORAGE
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: enforce user-owned paths OR group-owned paths.
-- Path layouts:
--   items/<user-id>/<item-id>/<filename>        -- personal items
--   items/group-<group-id>/<item-id>/<filename> -- group items (group admins write)
-- `storage.foldername(name)` is 1-indexed, so [2] is the second segment (owner slot).
--
-- Centralised predicate so the 3 write policies don't duplicate the regex/replace logic.
CREATE OR REPLACE FUNCTION private.item_photo_owner_slot_matches(p_name text, p_caller uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, storage, pg_temp
AS $$
  WITH folder AS (
    SELECT (storage.foldername(p_name))[2] AS slot
  ),
  parsed AS (
    SELECT
      slot,
      replace(slot, 'group-', '') AS group_id_text
    FROM folder
  )
  SELECT
    p.slot = p_caller::text
    OR (
      p.slot LIKE 'group-%'
      AND p.group_id_text ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND private.is_group_admin(p.group_id_text::uuid, p_caller)
    )
  FROM parsed p;
$$;

CREATE POLICY "item_photos_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'item-photos'
    AND private.item_photo_owner_slot_matches(name, (select auth.uid()))
  );

CREATE POLICY "item_photos_storage_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'item-photos');

CREATE POLICY "item_photos_storage_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'item-photos'
    AND private.item_photo_owner_slot_matches(name, (select auth.uid()))
  );

CREATE POLICY "item_photos_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'item-photos'
    AND private.item_photo_owner_slot_matches(name, (select auth.uid()))
  );
