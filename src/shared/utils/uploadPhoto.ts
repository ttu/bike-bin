import { supabase } from '@/shared/api/supabase';

interface UploadPhotoParams {
  bucket: string;
  storagePath: string;
  localUri: string;
  table: string;
  entityIdColumn: string;
  entityId: string;
  sortOrder: number;
}

/**
 * Uploads a local image to Supabase Storage and inserts a DB row.
 * Throws on any upload or insert error.
 */
export async function uploadPhoto({
  bucket,
  storagePath,
  localUri,
  table,
  entityIdColumn,
  entityId,
  sortOrder,
}: UploadPhotoParams): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, blob, { contentType: 'image/jpeg' });

  if (uploadError) throw uploadError;

  const { error: dbError } = await supabase.from(table).insert({
    [entityIdColumn]: entityId,
    storage_path: storagePath,
    sort_order: sortOrder,
  });

  if (dbError) throw dbError;

  return storagePath;
}

interface GetPhotoCountParams {
  table: string;
  entityIdColumn: string;
  entityId: string;
}

/**
 * Returns the current photo count for an entity.
 */
export async function getPhotoCount({
  table,
  entityIdColumn,
  entityId,
}: GetPhotoCountParams): Promise<number> {
  const { data } = await supabase.from(table).select('id').eq(entityIdColumn, entityId);

  return data?.length ?? 0;
}
