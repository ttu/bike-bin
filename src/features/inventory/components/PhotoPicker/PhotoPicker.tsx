import { View, Image, StyleSheet, Pressable } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/api/supabase';
export interface PickerPhoto {
  id: string;
  storagePath: string;
  localUri?: string;
}
import { spacing, borderRadius, iconSize } from '@/shared/theme';

const MAX_PHOTOS = 5;

interface PhotoPickerProps {
  photos: PickerPhoto[];
  onAdd: () => void;
  onRemove?: (photoId: string) => void;
  onSetPrimary?: (photoId: string) => void;
  isUploading: boolean;
}

export function PhotoPicker({
  photos,
  onAdd,
  onRemove,
  onSetPrimary,
  isUploading,
}: PhotoPickerProps) {
  const theme = useTheme();
  const { t } = useTranslation('inventory');
  const canAdd = photos.length < MAX_PHOTOS;

  return (
    <View>
      <Text variant="labelLarge" style={styles.label}>
        {t('form.photos', { count: photos.length })}
      </Text>
      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <Pressable
            key={photo.id}
            onPress={index !== 0 && onSetPrimary ? () => onSetPrimary(photo.id) : undefined}
            accessibilityLabel={index === 0 ? t('photos.primaryPhoto') : t('photos.setAsPrimary')}
          >
            <View style={[styles.photoTile, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Image
                source={{
                  uri:
                    photo.localUri ??
                    supabase.storage.from('item-photos').getPublicUrl(photo.storagePath).data
                      .publicUrl,
                }}
                style={styles.photoImage}
              />
              {index === 0 && (
                <View style={[styles.primaryBadge, { backgroundColor: theme.colors.primary }]}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onPrimary }}>
                    1
                  </Text>
                </View>
              )}
              {onRemove && (
                <Pressable
                  style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
                  onPress={() => onRemove(photo.id)}
                  accessibilityLabel={t('photos.removePhoto')}
                >
                  <MaterialCommunityIcons name="close" size={14} color={theme.colors.onError} />
                </Pressable>
              )}
            </View>
          </Pressable>
        ))}

        {canAdd && (
          <Pressable
            style={[styles.addTile, { borderColor: theme.colors.outline }]}
            onPress={onAdd}
            disabled={isUploading}
            accessibilityLabel="Add photo"
          >
            {isUploading ? (
              <ActivityIndicator size="small" />
            ) : (
              <MaterialCommunityIcons
                name="plus"
                size={iconSize.lg}
                color={theme.colors.onSurfaceVariant}
              />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoTile: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden' as const,
  },
  photoImage: {
    width: 80,
    height: 80,
  },
  addTile: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
