-- ============================================================
-- STORAGE
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: enforce user-owned paths
CREATE POLICY "item_photos_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'item-photos'
    AND (storage.foldername(name))[2] = (select auth.uid())::text
  );

CREATE POLICY "item_photos_storage_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'item-photos');

CREATE POLICY "item_photos_storage_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'item-photos' AND (storage.foldername(name))[2] = (select auth.uid())::text);

CREATE POLICY "item_photos_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'item-photos' AND (storage.foldername(name))[2] = (select auth.uid())::text);

