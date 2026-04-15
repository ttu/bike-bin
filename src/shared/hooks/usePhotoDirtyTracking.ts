import { useEffect, useMemo, useState } from 'react';

/**
 * Tracks whether a photo list has changed from its initial baseline.
 *
 * Captures a baseline snapshot of photo IDs once both `isEntityReady` and
 * `isPhotosReady` are true, then compares the current photos against it.
 */
export function usePhotoDirtyTracking(
  photos: readonly { id: string }[],
  isEntityReady: boolean,
  isPhotosReady: boolean,
): boolean {
  const [photoBaseline, setPhotoBaseline] = useState<string[] | undefined>(undefined);

  const photoIdsKey = useMemo(() => photos.map((p) => p.id).join('|'), [photos]);

  useEffect(() => {
    if (!isEntityReady || !isPhotosReady) return;
    const ids = photoIdsKey.length > 0 ? photoIdsKey.split('|') : [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync baseline when photo query data or order changes
    setPhotoBaseline(ids);
  }, [isEntityReady, isPhotosReady, photoIdsKey]);

  return useMemo(() => {
    if (photoBaseline === undefined) return false;
    if (photos.length !== photoBaseline.length) return true;
    return photos.some((p, i) => p.id !== photoBaseline[i]);
  }, [photos, photoBaseline]);
}
