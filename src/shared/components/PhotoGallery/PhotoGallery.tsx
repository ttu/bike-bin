import { useMemo, useState } from 'react';
import { View, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
/** Minimal photo shape needed for gallery display. */
interface GalleryPhoto {
  id: string;
  storagePath: string;
}
import { supabase } from '@/shared/api/supabase';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';

const MAX_GALLERY_WIDTH = 500;
const ASPECT_RATIO = 0.75; // 4:3

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
}

function ParallaxPhoto({
  photo,
  index,
  scrollX,
  themed,
  galleryWidth,
}: {
  photo: GalleryPhoto;
  index: number;
  scrollX: Animated.Value;
  themed: ReturnType<typeof useThemedStyles>;
  galleryWidth: number;
}) {
  const { data } = supabase.storage.from('item-photos').getPublicUrl(photo.storagePath);

  const inputRange = [(index - 1) * galleryWidth, index * galleryWidth, (index + 1) * galleryWidth];

  const translateX = scrollX.interpolate({
    inputRange,
    outputRange: [-galleryWidth * 0.1, 0, galleryWidth * 0.1],
  });

  const galleryHeight = galleryWidth * ASPECT_RATIO;

  return (
    <View
      key={photo.id}
      style={[
        styles.photoContainer,
        themed.surfaceVariantBg,
        { width: galleryWidth, height: galleryHeight },
      ]}
    >
      <Animated.Image
        source={{ uri: data.publicUrl }}
        style={[styles.photo, { transform: [{ translateX }] }]}
        resizeMode="cover"
      />
    </View>
  );
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const theme = useTheme<AppTheme>();
  const themed = useThemedStyles(theme);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useMemo(() => new Animated.Value(0), []);
  const { width: windowWidth } = useWindowDimensions();

  const galleryWidth = Math.min(windowWidth, MAX_GALLERY_WIDTH);
  const galleryHeight = galleryWidth * ASPECT_RATIO;

  if (photos.length === 0) {
    return (
      <View
        style={[
          styles.placeholder,
          themed.surfaceVariantBg,
          { width: galleryWidth, height: galleryHeight },
        ]}
      >
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
    <View style={{ width: galleryWidth }}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / galleryWidth);
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
            galleryWidth={galleryWidth}
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  photoContainer: {
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
