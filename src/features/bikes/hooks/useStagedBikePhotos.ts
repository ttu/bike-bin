import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import { uploadPhoto } from '@/shared/utils/uploadPhoto';
import { PhotoLimitExceededError } from '@/shared/utils/subscriptionLimitErrors';
import type { BikeId } from '@/shared/types';
import type { PickerPhoto } from '@/shared/components/PhotoPicker/PhotoPicker';

const ITEM_PHOTOS_BUCKET = 'item-photos';

function newStagedPhotoId(): string {
  const c = globalThis.crypto;
  if (c !== undefined && typeof c.randomUUID === 'function') {
    return `staged-${c.randomUUID()}`;
  }
  return `staged-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Best-effort removal of uploaded objects when a later upload fails (DB rows are removed with the bike). */
async function removeStoragePathsBestEffort(bucket: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(bucket).remove(paths);
}

interface StagedPhoto {
  id: string;
  localUri: string;
  fileName: string;
}

interface UseStagedBikePhotosReturn {
  stagedPhotos: PickerPhoto[];
  addStaged: (uri: string, fileName: string) => void;
  removeStaged: (id: string) => void;
  uploadAll: (bikeId: BikeId) => Promise<void>;
  isUploading: boolean;
}

export function useStagedBikePhotos(): UseStagedBikePhotosReturn {
  const [photos, setPhotos] = useState<StagedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addStaged = useCallback((uri: string, fileName: string) => {
    setPhotos((prev) => [...prev, { id: newStagedPhotoId(), localUri: uri, fileName }]);
  }, []);

  const removeStaged = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const uploadAll = useCallback(
    async (bikeId: BikeId) => {
      if (photos.length === 0 || !user) return;

      setIsUploading(true);
      try {
        const [limRes, cntRes] = await Promise.all([
          supabase.rpc('get_my_photo_limit'),
          supabase.rpc('get_my_photo_count'),
        ]);
        if (limRes.error) {
          throw limRes.error;
        }
        if (cntRes.error) {
          throw cntRes.error;
        }
        const lim = limRes.data;
        const cnt = cntRes.data;
        if (lim != null && cnt != null && cnt + photos.length > lim) {
          throw new PhotoLimitExceededError();
        }

        const uploadedStoragePaths: string[] = [];
        try {
          for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            const storagePath = `bikes/${user.id}/${bikeId}/${photo.fileName}`;

            const returnedPath = await uploadPhoto({
              bucket: ITEM_PHOTOS_BUCKET,
              storagePath,
              localUri: photo.localUri,
              table: 'bike_photos',
              entityIdColumn: 'bike_id',
              entityId: bikeId,
              sortOrder: i + 1,
            });
            uploadedStoragePaths.push(returnedPath);
          }
        } catch (uploadError) {
          await removeStoragePathsBestEffort(ITEM_PHOTOS_BUCKET, uploadedStoragePaths);
          throw uploadError;
        }

        queryClient.invalidateQueries({ queryKey: ['bike_photos', bikeId] });
        queryClient.invalidateQueries({ queryKey: ['bikes', bikeId] });
        queryClient.invalidateQueries({ queryKey: ['bikes', user.id] });
        queryClient.invalidateQueries({ queryKey: ['photo-row-capacity'] });
      } finally {
        setIsUploading(false);
      }
    },
    [photos, user, queryClient],
  );

  const stagedPhotos: PickerPhoto[] = photos.map((p) => ({
    id: p.id,
    storagePath: '',
    localUri: p.localUri,
  }));

  return { stagedPhotos, addStaged, removeStaged, uploadAll, isUploading };
}
