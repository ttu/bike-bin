import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export interface CachedAvatarImageProps {
  readonly uri: string;
  readonly size: number;
  /** Stable id for disk cache (defaults to uri) */
  readonly cacheKey?: string;
  readonly testID?: string;
}

/**
 * Circular remote avatar with memory + disk caching (expo-image).
 */
export function CachedAvatarImage({ uri, size, cacheKey, testID }: CachedAvatarImageProps) {
  const key = cacheKey ?? uri;
  const imageStyle = StyleSheet.create({
    image: { width: size, height: size, borderRadius: size / 2 },
  }).image;

  return (
    <Image
      testID={testID}
      accessible={false}
      source={{ uri, cacheKey: key }}
      style={imageStyle}
      contentFit="cover"
      cachePolicy="memory-disk"
      recyclingKey={key}
    />
  );
}
