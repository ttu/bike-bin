import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useEntityPhotoUpload,
  type EntityPhotoUploadError,
} from '@/shared/hooks/useEntityPhotoUpload';
import type { BikeId } from '@/shared/types';

interface UseBikePhotoUploadReturn {
  pickAndUpload: (bikeId: BikeId) => Promise<string | undefined>;
  isUploading: boolean;
  error: string | undefined;
}

function translate(
  error: EntityPhotoUploadError,
  t: (key: string, opts?: Record<string, unknown>) => string,
  tInv: (key: string) => string,
  tCommon: (key: string) => string,
): string {
  if (error.kind === 'max-per-entity') {
    return t('limit.maxPhotosPerEntity', { max: error.max });
  }
  if (error.kind === 'account-limit') {
    return tInv('limit.saveSnackbarPhoto');
  }
  return error.message || tCommon('errors.uploadFailed');
}

export function useBikePhotoUpload(): UseBikePhotoUploadReturn {
  const { t } = useTranslation('bikes');
  const { t: tInv } = useTranslation('inventory');
  const { t: tCommon } = useTranslation('common');

  const { pickAndUpload, isUploading, error } = useEntityPhotoUpload<BikeId>({
    bucket: 'item-photos',
    table: 'bike_photos',
    entityIdColumn: 'bike_id',
    pathPrefix: 'bikes',
    photoQueryKey: 'bike_photos',
    parentQueryKey: 'bikes',
  });

  const translatedError = useMemo(
    () => (error ? translate(error, t, tInv, tCommon) : undefined),
    [error, t, tInv, tCommon],
  );

  return { pickAndUpload, isUploading, error: translatedError };
}
