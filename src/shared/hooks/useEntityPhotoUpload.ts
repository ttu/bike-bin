import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { useImagePicker } from '@/shared/hooks/useImagePicker';
import {
  getUnknownErrorMessage,
  isPhotoLimitExceededError,
} from '@/shared/utils/subscriptionLimitErrors';
import { uploadPhoto, getPhotoCount } from '@/shared/utils/uploadPhoto';

export const MAX_PHOTOS_PER_ENTITY = 5;

export type EntityPhotoUploadError =
  | { kind: 'max-per-entity'; max: number }
  | { kind: 'account-limit' }
  | { kind: 'unknown'; message: string };

export interface EntityPhotoUploadConfig {
  bucket: string;
  table: 'item_photos' | 'bike_photos';
  entityIdColumn: 'item_id' | 'bike_id';
  /** Storage path prefix ('items' or 'bikes'). */
  pathPrefix: string;
  /** Query key for the per-entity photo list. */
  photoQueryKey: string;
  /** Optional query key for the parent entity list (invalidated on success). */
  parentQueryKey?: string;
}

export interface UseEntityPhotoUploadReturn<TEntityId extends string> {
  pickAndUpload: (entityId: TEntityId) => Promise<string | undefined>;
  isUploading: boolean;
  error: EntityPhotoUploadError | undefined;
}

/**
 * Shared single-photo picker + uploader. Enforces per-entity cap client-side
 * (MAX_PHOTOS_PER_ENTITY) and relies on the DB trigger to enforce the account
 * photo cap, surfacing `account-limit` when the trigger raises `23514`.
 */
export function useEntityPhotoUpload<TEntityId extends string>(
  config: EntityPhotoUploadConfig,
): UseEntityPhotoUploadReturn<TEntityId> {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<EntityPhotoUploadError | undefined>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { pickImage } = useImagePicker();

  const { bucket, table, entityIdColumn, pathPrefix, photoQueryKey, parentQueryKey } = config;

  const pickAndUpload = useCallback(
    async (entityId: TEntityId): Promise<string | undefined> => {
      setError(undefined);

      const picked = await pickImage();
      if (!picked) {
        return undefined;
      }

      setIsUploading(true);
      try {
        const count = await getPhotoCount({ table, entityIdColumn, entityId });
        const sortOrder = count + 1;

        if (sortOrder > MAX_PHOTOS_PER_ENTITY) {
          setError({ kind: 'max-per-entity', max: MAX_PHOTOS_PER_ENTITY });
          return undefined;
        }

        const storagePath = `${pathPrefix}/${user!.id}/${entityId}/${picked.fileName}`;

        const result = await uploadPhoto({
          bucket,
          storagePath,
          localUri: picked.uri,
          table,
          entityIdColumn,
          entityId,
          sortOrder,
        });

        queryClient.invalidateQueries({ queryKey: [photoQueryKey, entityId] });
        if (parentQueryKey) {
          queryClient.invalidateQueries({ queryKey: [parentQueryKey] });
        }
        queryClient.invalidateQueries({ queryKey: ['photo-row-capacity'] });

        return result;
      } catch (err) {
        if (isPhotoLimitExceededError(err)) {
          setError({ kind: 'account-limit' });
          return undefined;
        }
        setError({ kind: 'unknown', message: getUnknownErrorMessage(err) });
        return undefined;
      } finally {
        setIsUploading(false);
      }
    },
    [
      user,
      queryClient,
      pickImage,
      bucket,
      table,
      entityIdColumn,
      pathPrefix,
      photoQueryKey,
      parentQueryKey,
    ],
  );

  return { pickAndUpload, isUploading, error };
}
