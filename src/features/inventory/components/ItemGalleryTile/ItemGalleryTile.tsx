import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { Item } from '@/shared/types';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable/AnimatedPressable';
import { CachedListThumbnail } from '@/shared/components/CachedListThumbnail';
import { ITEM_INVENTORY_THUMBNAIL } from '../../constants';
import { getItemThumbnailPublicUrl } from '../../utils/itemThumbnailPublicUrl';

interface ItemGalleryTileProps {
  item: Item;
  onPress?: (item: Item) => void;
}

export function ItemGalleryTile({ item, onPress }: ItemGalleryTileProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');
  const thumbnailUri = getItemThumbnailPublicUrl(item.thumbnailStoragePath);

  return (
    <AnimatedPressable
      onPress={() => onPress?.(item)}
      style={[
        styles.container,
        {
          backgroundColor: theme.customColors.surfaceContainerLowest,
          shadowColor: theme.colors.onSurface,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        item.quantity > 1
          ? t('card.a11yNameWithQuantity', { name: item.name, count: item.quantity })
          : item.name
      }
    >
      <View
        style={[
          styles.thumbnailWrap,
          {
            width: ITEM_INVENTORY_THUMBNAIL.width,
            height: ITEM_INVENTORY_THUMBNAIL.height,
            backgroundColor: theme.colors.surfaceVariant,
          },
        ]}
      >
        {thumbnailUri ? (
          <CachedListThumbnail
            uri={thumbnailUri}
            cacheKey={item.thumbnailStoragePath}
            style={styles.thumbnailImage}
          />
        ) : (
          <Text
            variant="labelSmall"
            numberOfLines={3}
            ellipsizeMode="tail"
            style={[styles.nameFallback, { color: theme.colors.onSurface }]}
          >
            {item.name}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  thumbnailWrap: {
    alignSelf: 'center',
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  nameFallback: {
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
  },
});
