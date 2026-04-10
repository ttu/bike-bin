import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useEntityPhotoUpload,
  type EntityPhotoUploadError,
} from '@/shared/hooks/useEntityPhotoUpload';
import type { ItemId } from '@/shared/types';

interface UsePhotoUploadReturn {
  pickAndUpload: (itemId: ItemId) => Promise<string | undefined>;
  isUploading: boolean;
  error: string | undefined;
}

function translate(
  error: EntityPhotoUploadError,
  t: (key: string, opts?: Record<string, unknown>) => string,
  tCommon: (key: string) => string,
): string {
  if (error.kind === 'max-per-entity') {
    return t('limit.maxPhotosPerEntity', { max: error.max });
  }
  if (error.kind === 'account-limit') {
    return t('limit.saveSnackbarPhoto');
  }
  if (error.kind === 'unknown') {
    console.warn('Photo upload error:', error.message);
  }
  return tCommon('errors.uploadFailed');
}

export function usePhotoUpload(): UsePhotoUploadReturn {
  const { t } = useTranslation('inventory');
  const { t: tCommon } = useTranslation('common');

  const { pickAndUpload, isUploading, error } = useEntityPhotoUpload<ItemId>({
    bucket: 'item-photos',
    table: 'item_photos',
    entityIdColumn: 'item_id',
    pathPrefix: 'items',
    photoQueryKey: 'item_photos',
  });

  const translatedError = useMemo(
    () => (error ? translate(error, t, tCommon) : undefined),
    [error, t, tCommon],
  );

  return { pickAndUpload, isUploading, error: translatedError };
}
