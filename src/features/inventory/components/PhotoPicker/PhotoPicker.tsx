import { View, StyleSheet, Pressable } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import type { ItemPhoto } from '@/shared/types';
import { spacing, borderRadius, iconSize } from '@/shared/theme';

const MAX_PHOTOS = 5;

interface PhotoPickerProps {
  photos: ItemPhoto[];
  onAdd: () => void;
  onRemove?: (photoId: string) => void;
  isUploading: boolean;
}

export function PhotoPicker({ photos, onAdd, onRemove, isUploading }: PhotoPickerProps) {
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
          <View
            key={photo.id}
            style={[styles.photoTile, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            <MaterialCommunityIcons
              name="image"
              size={iconSize.lg}
              color={theme.colors.onSurfaceVariant}
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
                accessibilityLabel="Remove photo"
              >
                <MaterialCommunityIcons name="close" size={14} color={theme.colors.onError} />
              </Pressable>
            )}
          </View>
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
