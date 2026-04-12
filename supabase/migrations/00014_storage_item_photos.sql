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
CREATE POLICY "item_photos_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'item-photos'
    AND (
      (storage.foldername(name))[2] = (select auth.uid())::text
      OR (
        (storage.foldername(name))[2] LIKE 'group-%'
        AND public.is_group_admin(
          replace((storage.foldername(name))[2], 'group-', '')::uuid,
          (select auth.uid())
        )
      )
    )
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
    AND (
      (storage.foldername(name))[2] = (select auth.uid())::text
      OR (
        (storage.foldername(name))[2] LIKE 'group-%'
        AND public.is_group_admin(
          replace((storage.foldername(name))[2], 'group-', '')::uuid,
          (select auth.uid())
        )
      )
    )
  );

CREATE POLICY "item_photos_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'item-photos'
    AND (
      (storage.foldername(name))[2] = (select auth.uid())::text
      OR (
        (storage.foldername(name))[2] LIKE 'group-%'
        AND public.is_group_admin(
          replace((storage.foldername(name))[2], 'group-', '')::uuid,
          (select auth.uid())
        )
      )
    )
  );

