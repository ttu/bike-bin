import { supabase } from '@/shared/api/supabase';

export function getItemThumbnailPublicUrl(
  thumbnailStoragePath: string | undefined,
): string | undefined {
  if (!thumbnailStoragePath) {
    return undefined;
  }
  return supabase.storage.from('item-photos').getPublicUrl(thumbnailStoragePath).data.publicUrl;
}
