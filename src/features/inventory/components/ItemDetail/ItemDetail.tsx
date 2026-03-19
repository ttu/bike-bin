import { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Chip, Button, Divider, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { Item, ItemPhoto } from '@/shared/types';
import { ItemStatus } from '@/shared/types';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { getStatusColor, canDelete } from '../../utils/status';
import { PhotoGallery } from '@/shared/components';

interface ItemDetailProps {
  item: Item;
  photos: ItemPhoto[];
  onMarkDonated?: () => void;
  onMarkSold?: () => void;
  onMarkReturned?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export function ItemDetail({
  item,
  photos,
  onMarkDonated,
  onMarkSold,
  onMarkReturned,
  onArchive,
  onDelete,
}: ItemDetailProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');
  const themed = useThemedStyles(theme);

  const statusColorToken = getStatusColor(item.status);
  const statusColor =
    statusColorToken === 'warning'
      ? theme.customColors.warning
      : statusColorToken === 'success'
        ? theme.customColors.success
        : theme.colors.outline;

  const canShowDonateAction =
    item.status === ItemStatus.Stored || item.status === ItemStatus.Mounted;
  const canShowSoldAction = item.status === ItemStatus.Stored || item.status === ItemStatus.Mounted;
  const canShowReturnedAction = item.status === ItemStatus.Loaned;
  const canShowArchiveAction = item.status !== ItemStatus.Archived;
  const canShowDeleteAction = canDelete(item);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PhotoGallery photos={photos} />

      {/* Title + Status */}
      <View style={styles.section}>
        <View style={styles.titleRow}>
          <Text variant="headlineSmall" style={[styles.title, themed.onSurface]}>
            {item.name}
          </Text>
          <Chip compact style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}>
            <Text variant="labelSmall" style={{ color: statusColor }}>
              {t(`status.${item.status}`)}
            </Text>
          </Chip>
        </View>

        {/* Subtitle */}
        <Text variant="bodyMedium" style={themed.onSurfaceVariant}>
          {t(`category.${item.category}`)}
          {item.subcategory
            ? ` · ${t(`subcategory.${item.subcategory}`, { defaultValue: item.subcategory })}`
            : ''}
          {item.brand ? ` · ${item.brand}` : ''}
          {item.model ? ` · ${item.model}` : ''}
        </Text>
      </View>

      <Divider />

      {/* Availability */}
      {item.availabilityTypes.length > 0 && (
        <View style={styles.section}>
          <View style={styles.chipRow}>
            {item.availabilityTypes.map((type) => (
              <Chip key={type} compact>
                {t(`availability.${type}`)}
                {type === 'sellable' && item.price !== undefined ? ` · €${item.price}` : ''}
              </Chip>
            ))}
          </View>
        </View>
      )}

      {/* Detail Grid */}
      <View style={[styles.section, styles.detailGrid]}>
        <DetailRow label={t('detail.conditionLabel')} value={t(`condition.${item.condition}`)} />
        {item.age && (
          <DetailRow
            label={t('detail.ageLabel')}
            value={t(`form.ageOption.${item.age}`, { defaultValue: item.age })}
          />
        )}
        {item.usageKm !== undefined && (
          <DetailRow
            label={t('detail.usageLabel')}
            value={`${item.usageKm} ${item.usageUnit ?? 'km'}`}
          />
        )}
        {item.storageLocation && (
          <DetailRow label={t('detail.storageLabel')} value={item.storageLocation} />
        )}
      </View>

      {/* Description */}
      {item.description && (
        <View style={styles.section}>
          <Text variant="bodyMedium" style={themed.onSurface}>
            {item.description}
          </Text>
        </View>
      )}

      <Divider />

      {/* Actions */}
      <View style={styles.section}>
        {canShowReturnedAction && onMarkReturned && (
          <Button mode="contained" onPress={onMarkReturned} style={styles.actionButton}>
            {t('detail.markReturned')}
          </Button>
        )}
        {canShowDonateAction && onMarkDonated && (
          <Button mode="outlined" onPress={onMarkDonated} style={styles.actionButton}>
            {t('detail.markDonated')}
          </Button>
        )}
        {canShowSoldAction && onMarkSold && (
          <Button mode="outlined" onPress={onMarkSold} style={styles.actionButton}>
            {t('detail.markSold')}
          </Button>
        )}
        {canShowArchiveAction && onArchive && (
          <Button mode="outlined" onPress={onArchive} style={styles.actionButton}>
            {t('detail.archive')}
          </Button>
        )}
        {canShowDeleteAction && onDelete && (
          <Button
            mode="outlined"
            onPress={onDelete}
            textColor={theme.colors.error}
            style={styles.actionButton}
          >
            {t('deleteItem')}
          </Button>
        )}
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme<AppTheme>();
  const themed = useThemedStyles(theme);
  return (
    <View style={[styles.detailRow, themed.detailRowBorder]}>
      <Text variant="labelMedium" style={themed.onSurfaceVariant}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={themed.onSurface}>
        {value}
      </Text>
    </View>
  );
}

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        detailRowBorder: { borderBottomColor: theme.colors.outline },
      }),
    [theme],
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['2xl'],
  },
  section: {
    padding: spacing.base,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
    marginRight: spacing.sm,
  },
  statusChip: {
    height: 28,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  detailGrid: {
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
  },
});
