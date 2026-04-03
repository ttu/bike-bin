import { Image } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';

export interface CachedListThumbnailProps {
  uri: string;
  /** Storage path or other stable id — used for disk cache key and recycled list cells */
  cacheKey?: string;
  style: StyleProp<ImageStyle>;
}

/**
 * Remote list thumbnail with memory + disk caching (expo-image).
 * Prefer for inventory / bike grids where images change rarely.
 */
export function CachedListThumbnail({ uri, cacheKey, style }: CachedListThumbnailProps) {
  const key = cacheKey ?? uri;
  return (
    <Image
      accessible={false}
      source={{ uri, cacheKey: key }}
      style={style}
      contentFit="cover"
      cachePolicy="memory-disk"
      recyclingKey={key}
    />
  );
}
