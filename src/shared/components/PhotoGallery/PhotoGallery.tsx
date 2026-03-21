import { useMemo, useState } from 'react';
import { View, ScrollView, Image, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ItemPhoto } from '@/shared/types';
import { supabase } from '@/shared/api/supabase';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GALLERY_HEIGHT = SCREEN_WIDTH * 0.75; // 4:3 aspect ratio

interface PhotoGalleryProps {
  photos: ItemPhoto[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const theme = useTheme<AppTheme>();
  const themed = useThemedStyles(theme);
  const [activeIndex, setActiveIndex] = useState(0);

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
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
      >
        {photos.map((photo) => {
          const { data } = supabase.storage.from('item-photos').getPublicUrl(photo.storagePath);
          return (
            <View key={photo.id} style={[styles.photoContainer, themed.surfaceVariantBg]}>
              <Image source={{ uri: data.publicUrl }} style={styles.photo} resizeMode="cover" />
            </View>
          );
        })}
      </ScrollView>

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
