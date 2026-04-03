import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  View,
  Animated,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
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

const AnimatedCachedGalleryImage = Animated.createAnimatedComponent(Image);

const MAX_GALLERY_WIDTH = 500;
const ASPECT_RATIO = 0.75; // 4:3
const PLACEHOLDER_MAX_HEIGHT = 280;

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  /** When set, caps gallery width (defaults to 500). Use on wide layouts for a larger hero. */
  maxGalleryWidth?: number;
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
      <AnimatedCachedGalleryImage
        accessible={false}
        source={{ uri: data.publicUrl, cacheKey: photo.storagePath }}
        style={[styles.photo, { transform: [{ translateX }] }]}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={photo.storagePath}
      />
    </View>
  );
}

export function PhotoGallery({ photos, maxGalleryWidth }: PhotoGalleryProps) {
  const theme = useTheme<AppTheme>();
  const themed = useThemedStyles(theme);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useMemo(() => new Animated.Value(0), []);
  const scrollViewRef = useRef<ScrollView>(null);
  const { width: windowWidth } = useWindowDimensions();

  const widthCap = maxGalleryWidth ?? MAX_GALLERY_WIDTH;
  const galleryWidth = Math.min(windowWidth, widthCap);
  const galleryHeight = galleryWidth * ASPECT_RATIO;

  const scrollToIndex = useCallback(
    (index: number) => {
      scrollViewRef.current?.scrollTo({ x: index * galleryWidth, animated: true });
      setActiveIndex(index);
    },
    [galleryWidth],
  );

  if (photos.length === 0) {
    const placeholderHeight = Math.min(galleryHeight, PLACEHOLDER_MAX_HEIGHT);
    return (
      <View
        style={[
          styles.placeholder,
          themed.surfaceVariantBg,
          { width: galleryWidth, height: placeholderHeight },
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
    <View style={{ width: galleryWidth, alignSelf: 'center' }}>
      <Animated.ScrollView
        ref={scrollViewRef as React.RefObject<ScrollView>}
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

      {Platform.OS === 'web' && photos.length > 1 && (
        <>
          {activeIndex > 0 && (
            <Pressable
              style={[styles.arrow, styles.arrowLeft, { backgroundColor: theme.colors.surface }]}
              onPress={() => scrollToIndex(activeIndex - 1)}
              accessibilityRole="button"
              accessibilityLabel="Previous photo"
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={iconSize.lg}
                color={theme.colors.onSurface}
              />
            </Pressable>
          )}
          {activeIndex < photos.length - 1 && (
            <Pressable
              style={[styles.arrow, styles.arrowRight, { backgroundColor: theme.colors.surface }]}
              onPress={() => scrollToIndex(activeIndex + 1)}
              accessibilityRole="button"
              accessibilityLabel="Next photo"
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={iconSize.lg}
                color={theme.colors.onSurface}
              />
            </Pressable>
          )}
        </>
      )}

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
    alignSelf: 'center',
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
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.85,
  },
  arrowLeft: {
    left: spacing.sm,
  },
  arrowRight: {
    right: spacing.sm,
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
