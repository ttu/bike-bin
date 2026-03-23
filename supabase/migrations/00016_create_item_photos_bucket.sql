-- Create the item-photos storage bucket for item and bike photo uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "item_photos_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'item-photos');

-- Allow anyone to read photos (public bucket)
CREATE POLICY "item_photos_storage_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'item-photos');

-- Allow authenticated users to update their own photos
CREATE POLICY "item_photos_storage_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'item-photos' AND (storage.foldername(name))[2] = auth.uid()::text);

-- Allow authenticated users to delete their own photos
CREATE POLICY "item_photos_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'item-photos' AND (storage.foldername(name))[2] = auth.uid()::text);
