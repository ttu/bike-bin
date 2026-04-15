import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import { uploadPhoto } from '@/shared/utils/uploadPhoto';
import { PhotoLimitExceededError } from '@/shared/utils/subscriptionLimitErrors';
import type { ItemId } from '@/shared/types';
import type { PickerPhoto } from '@/shared/components/PhotoPicker/PhotoPicker';

interface StagedPhoto {
  id: string;
  localUri: string;
  fileName: string;
}

interface UseStagedPhotosReturn {
  stagedPhotos: PickerPhoto[];
  addStaged: (uri: string, fileName: string) => void;
  removeStaged: (id: string) => void;
  uploadAll: (itemId: ItemId) => Promise<void>;
  isUploading: boolean;
}

export function useStagedPhotos(): UseStagedPhotosReturn {
  const [photos, setPhotos] = useState<StagedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addStaged = useCallback((uri: string, fileName: string) => {
    setPhotos((prev) => [...prev, { id: `staged-${Date.now()}`, localUri: uri, fileName }]);
  }, []);

  const removeStaged = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const uploadAll = useCallback(
    async (itemId: ItemId) => {
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

        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const storagePath = `items/${user.id}/${itemId}/${photo.fileName}`;

          await uploadPhoto({
            bucket: 'item-photos',
            storagePath,
            localUri: photo.localUri,
            table: 'item_photos',
            entityIdColumn: 'item_id',
            entityId: itemId,
            sortOrder: i + 1,
          });
        }

        queryClient.invalidateQueries({ queryKey: ['item_photos', itemId] });
        queryClient.invalidateQueries({ queryKey: ['items'] });
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
