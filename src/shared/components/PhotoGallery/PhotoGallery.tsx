import { useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
/** Minimal photo shape needed for gallery display. */
interface GalleryPhoto {
  id: string;
  storagePath: string;
}
import { supabase } from '@/shared/api/supabase';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GALLERY_HEIGHT = SCREEN_WIDTH * 0.75; // 4:3 aspect ratio

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
}

function ParallaxPhoto({
  photo,
  index,
  scrollX,
  themed,
}: {
  photo: GalleryPhoto;
  index: number;
  scrollX: SharedValue<number>;
  themed: ReturnType<typeof useThemedStyles>;
}) {
  const { data } = supabase.storage.from('item-photos').getPublicUrl(photo.storagePath);

  const animatedImageStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const translateX = interpolate(scrollX.value, inputRange, [
      -SCREEN_WIDTH * 0.1,
      0,
      SCREEN_WIDTH * 0.1,
    ]);
    return { transform: [{ translateX }] };
  });

  return (
    <View key={photo.id} style={[styles.photoContainer, themed.surfaceVariantBg]}>
      <Animated.Image
        source={{ uri: data.publicUrl }}
        style={[styles.photo, animatedImageStyle]}
        resizeMode="cover"
      />
    </View>
  );
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const theme = useTheme<AppTheme>();
  const themed = useThemedStyles(theme);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  if (photos.length === 0) {
    return (
      <View style={[styles.placeholder, themed.surfaceVariantBg]}>
        <MaterialCommunityIcons
          name="image-outline"
          size={iconSize.xl}
          color={theme.colors.onSurfaceVariant}
        />
        <Text variant="bodyMedium" style={themed.onSurfaceVariant}>
          No photos
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
      >
        {photos.map((photo, index) => (
          <ParallaxPhoto
            key={photo.id}
            photo={photo}
            index={index}
            scrollX={scrollX}
            themed={themed}
          />
        ))}
      </Animated.ScrollView>

      {photos.length > 1 && (
        <View style={styles.dots}>
          {photos.map((photo, index) => (
            <View
              key={photo.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activeIndex ? theme.colors.primary : theme.colors.outline,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        surfaceVariantBg: { backgroundColor: theme.colors.surfaceVariant },
      }),
    [theme],
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: SCREEN_WIDTH,
    height: GALLERY_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  photoContainer: {
    width: SCREEN_WIDTH,
    height: GALLERY_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
});
