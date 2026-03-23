import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/features/auth';
import type { ItemId } from '@/shared/types';
import type { PickerPhoto } from '../components/PhotoPicker/PhotoPicker';

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
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const storagePath = `items/${user.id}/${itemId}/${photo.fileName}`;

          const response = await fetch(photo.localUri);
          const blob = await response.blob();

          const { error: uploadError } = await supabase.storage
            .from('item-photos')
            .upload(storagePath, blob, { contentType: 'image/jpeg' });

          if (uploadError) throw uploadError;

          const { error: dbError } = await supabase.from('item_photos').insert({
            item_id: itemId,
            storage_path: storagePath,
            sort_order: i + 1,
          });

          if (dbError) throw dbError;
        }

        queryClient.invalidateQueries({ queryKey: ['item_photos', itemId] });
        queryClient.invalidateQueries({ queryKey: ['items'] });
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
