import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supabase } from '@/shared/api/supabase';
import { uploadPhoto } from '@/shared/utils/uploadPhoto';
import { PhotoLimitExceededError } from '@/shared/utils/subscriptionLimitErrors';
import { randomUuidV4 } from '@/shared/utils/randomUuid';
import type { PickerPhoto } from '@/shared/components/PhotoPicker/PhotoPicker';

const ITEM_PHOTOS_BUCKET = 'item-photos';

interface StagedPhoto {
  id: string;
  localUri: string;
  fileName: string;
}

export interface UseStagedEntityPhotosConfig<TEntityId extends string> {
  /** Storage path prefix, e.g. 'items' or 'bikes' (placed before user id). */
  pathPrefix: string;
  /** Photos table to insert into. */
  table: 'item_photos' | 'bike_photos';
  /** Foreign-key column name on the photos table. */
  entityIdColumn: 'item_id' | 'bike_id';
  /**
   * Query keys to invalidate after a successful upload. The hook also
   * appends `['photo-row-capacity']` automatically.
   */
  invalidationKeys: (entityId: TEntityId, userId: string) => readonly unknown[][];
}

export interface UseStagedEntityPhotosReturn<TEntityId extends string> {
  stagedPhotos: PickerPhoto[];
  addStaged: (uri: string, fileName: string) => void;
  removeStaged: (id: string) => void;
  uploadAll: (entityId: TEntityId) => Promise<void>;
  isUploading: boolean;
}

/**
 * Generic staged-photo hook used by inventory items and bikes alike.
 * Photos are held in local state until `uploadAll(entityId)` runs, which
 * checks the user's photo quota, uploads to storage, inserts photo rows,
 * and rolls back any uploaded objects if a later upload fails.
 */
export function useStagedEntityPhotos<TEntityId extends string>(
  config: UseStagedEntityPhotosConfig<TEntityId>,
): UseStagedEntityPhotosReturn<TEntityId> {
  const [photos, setPhotos] = useState<StagedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addStaged = useCallback((uri: string, fileName: string) => {
    setPhotos((prev) => [...prev, { id: `staged-${randomUuidV4()}`, localUri: uri, fileName }]);
  }, []);

  const removeStaged = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const uploadAll = useCallback(
    async (entityId: TEntityId) => {
      if (photos.length === 0 || !user) return;

      setIsUploading(true);
      try {
        const [limRes, cntRes] = await Promise.all([
          supabase.rpc('get_my_photo_limit'),
          supabase.rpc('get_my_photo_count'),
        ]);
        if (limRes.error) throw limRes.error;
        if (cntRes.error) throw cntRes.error;
        const lim = limRes.data;
        const cnt = cntRes.data;
        if (lim != null && cnt != null && cnt + photos.length > lim) {
          throw new PhotoLimitExceededError();
        }

        const uploadedStoragePaths: string[] = [];
        try {
          for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            const storagePath = `${config.pathPrefix}/${user.id}/${entityId}/${photo.fileName}`;

            const returnedPath = await uploadPhoto({
              bucket: ITEM_PHOTOS_BUCKET,
              storagePath,
              localUri: photo.localUri,
              table: config.table,
              entityIdColumn: config.entityIdColumn,
              entityId,
              sortOrder: i + 1,
            });
            uploadedStoragePaths.push(returnedPath);
          }
        } catch (uploadError) {
          if (uploadedStoragePaths.length > 0) {
            await supabase.storage.from(ITEM_PHOTOS_BUCKET).remove(uploadedStoragePaths);
          }
          throw uploadError;
        }

        for (const key of config.invalidationKeys(entityId, user.id)) {
          queryClient.invalidateQueries({ queryKey: key });
        }
        queryClient.invalidateQueries({ queryKey: ['photo-row-capacity'] });
      } finally {
        setIsUploading(false);
      }
    },
    [photos, user, queryClient, config],
  );

  const stagedPhotos: PickerPhoto[] = photos.map((p) => ({
    id: p.id,
    storagePath: '',
    localUri: p.localUri,
  }));

  return { stagedPhotos, addStaged, removeStaged, uploadAll, isUploading };
}
