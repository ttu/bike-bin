import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { useImagePicker } from '@/shared/hooks/useImagePicker';
import { uploadPhoto, getPhotoCount } from '@/shared/utils/uploadPhoto';
import type { ItemId } from '@/shared/types';

const MAX_PHOTOS = 5;

interface UsePhotoUploadReturn {
  pickAndUpload: (itemId: ItemId) => Promise<string | undefined>;
  isUploading: boolean;
  error: string | undefined;
}

export function usePhotoUpload(): UsePhotoUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { pickImage } = useImagePicker();

  const pickAndUpload = useCallback(
    async (itemId: ItemId): Promise<string | undefined> => {
      setError(undefined);

      const picked = await pickImage();
      if (!picked) {
        return undefined;
      }

      setIsUploading(true);
      try {
        const storagePath = `items/${user!.id}/${itemId}/${picked.fileName}`;

        const count = await getPhotoCount({
          table: 'item_photos',
          entityIdColumn: 'item_id',
          entityId: itemId,
        });
        const sortOrder = count + 1;

        if (sortOrder > MAX_PHOTOS) {
          setError(`Maximum ${MAX_PHOTOS} photos allowed`);
          return undefined;
        }

        const result = await uploadPhoto({
          bucket: 'item-photos',
          storagePath,
          localUri: picked.uri,
          table: 'item_photos',
          entityIdColumn: 'item_id',
          entityId: itemId,
          sortOrder,
        });

        queryClient.invalidateQueries({ queryKey: ['item_photos', itemId] });

        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        return undefined;
      } finally {
        setIsUploading(false);
      }
    },
    [user, queryClient, pickImage],
  );

  return { pickAndUpload, isUploading, error };
}
