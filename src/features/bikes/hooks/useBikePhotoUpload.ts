import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { useImagePicker } from '@/shared/hooks/useImagePicker';
import { uploadPhoto, getPhotoCount } from '@/shared/utils/uploadPhoto';
import type { BikeId } from '@/shared/types';

const MAX_PHOTOS = 5;

interface UseBikePhotoUploadReturn {
  pickAndUpload: (bikeId: BikeId) => Promise<string | undefined>;
  isUploading: boolean;
  error: string | undefined;
}

export function useBikePhotoUpload(): UseBikePhotoUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { pickImage } = useImagePicker();

  const pickAndUpload = useCallback(
    async (bikeId: BikeId): Promise<string | undefined> => {
      setError(undefined);

      const picked = await pickImage();
      if (!picked) {
        return undefined;
      }

      setIsUploading(true);
      try {
        const storagePath = `bikes/${user!.id}/${bikeId}/${picked.fileName}`;

        const count = await getPhotoCount({
          table: 'bike_photos',
          entityIdColumn: 'bike_id',
          entityId: bikeId,
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
          table: 'bike_photos',
          entityIdColumn: 'bike_id',
          entityId: bikeId,
          sortOrder,
        });

        queryClient.invalidateQueries({ queryKey: ['bike_photos', bikeId] });
        queryClient.invalidateQueries({ queryKey: ['bikes'] });

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
