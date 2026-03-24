-- Fix critical security issues identified in 2026-03-24 audit

-- ============================================================
-- 1. Fix storage INSERT policy: enforce user-owned path
-- Without this, any authenticated user can upload to any path
-- in the item-photos bucket, including other users' paths.
-- ============================================================

DROP POLICY IF EXISTS "item_photos_storage_insert" ON storage.objects;

CREATE POLICY "item_photos_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'item-photos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- ============================================================
-- 2. Enable RLS on geocode_cache
-- Without RLS, any client can read/write/delete cache entries
-- via PostgREST, enabling cache poisoning attacks.
-- Service role (used by Edge Functions) bypasses RLS.
-- ============================================================

ALTER TABLE geocode_cache ENABLE ROW LEVEL SECURITY;
