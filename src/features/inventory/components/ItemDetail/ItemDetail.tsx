import { useMemo, type ReactNode } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Text, Chip, Button, useTheme } from 'react-native-paper';
import { GradientButton } from '@/shared/components/GradientButton';
import { useTranslation } from 'react-i18next';
import type { Item, ItemPhoto } from '@/shared/types';
import { AvailabilityType, ItemCategory, ItemStatus } from '@/shared/types';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { getStatusColor } from '../../utils/status';
import { DetailCard, detailCardStyles, PhotoGallery } from '@/shared/components';
import { useDistanceUnit } from '@/features/profile';

const WIDE_BREAKPOINT = 768;
/** Max content width on wide viewports — centered column avoids stretched layouts on web. */
const WIDE_PAGE_MAX_WIDTH = 1120;

const CONDITION_ICONS: Record<string, string> = {
  new: 'shield-check',
  good: 'emoticon-happy-outline',
  worn: 'history',
  broken: 'close-circle-outline',
};

interface ItemDetailProps {
  item: Item;
  photos: ItemPhoto[];
  onMarkDonated?: () => void;
  onMarkSold?: () => void;
  onMarkReturned?: () => void;
  /** While resolving the active borrow request (mark returned uses it when present). */
  markReturnedLoading?: boolean;
  /** Opens archive vs delete choice; parent runs the usual confirmations. */
  onRemoveFromBin?: () => void;
  /** Restores an archived item to stored; parent runs confirmation. */
  onUnarchive?: () => void;
}

export function ItemDetail({
  item,
  photos,
  onMarkDonated,
  onMarkSold,
  onMarkReturned,
  markReturnedLoading = false,
  onRemoveFromBin,
  onUnarchive,
}: ItemDetailProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');
  const themed = useThemedStyles(theme);
  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= WIDE_BREAKPOINT;
  const wideContentWidth = Math.min(windowWidth, WIDE_PAGE_MAX_WIDTH);
  const wideHeroGalleryMax = Math.max(320, wideContentWidth - spacing.base * 2);
  const { distanceUnit } = useDistanceUnit();

  const statusColorToken = getStatusColor(item.status);
  const statusColor =
    statusColorToken === 'warning'
      ? theme.customColors.warning
      : statusColorToken === 'success'
        ? theme.customColors.success
        : theme.colors.outline;

  const canShowDonateAction =
    (item.status === ItemStatus.Stored || item.status === ItemStatus.Mounted) &&
    item.availabilityTypes.includes(AvailabilityType.Donatable);
  const canShowSoldAction =
    (item.status === ItemStatus.Stored || item.status === ItemStatus.Mounted) &&
    item.availabilityTypes.includes(AvailabilityType.Sellable);
  const canShowReturnedAction = item.status === ItemStatus.Loaned;
  const categoryBreadcrumb = [
    t(`category.${item.category}`),
    item.subcategory
      ? t(`subcategory.${item.subcategory}`, { defaultValue: item.subcategory })
      : undefined,
    item.brand,
  ]
    .filter(Boolean)
    .join(' \u00B7 ');

  const detailContent = (
    <>
      {/* Category breadcrumb */}
      <View style={styles.section}>
        <Text variant="labelSmall" style={[styles.breadcrumb, { color: theme.colors.primary }]}>
          {categoryBreadcrumb}
        </Text>

        {/* Title */}
        <Text variant="headlineMedium" style={[styles.title, themed.onSurface]}>
          {item.name}
        </Text>

        {/* Availability + Status chips */}
        <View style={styles.chipRow}>
          {item.availabilityTypes.map((type) => (
            <Chip
              key={type}
              compact
              style={[styles.statusChip, { backgroundColor: theme.colors.primary }]}
            >
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onPrimary, textTransform: 'uppercase' }}
              >
                {t(`availability.${type}`)}
              </Text>
            </Chip>
          ))}
          {item.status !== ItemStatus.Stored && (
            <Chip compact style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}>
              <Text variant="labelSmall" style={{ color: statusColor, textTransform: 'uppercase' }}>
                {t(`status.${item.status}`)}
              </Text>
            </Chip>
          )}
        </View>

        {/* Tags */}
        {item.tags.length > 0 && (
          <View style={[styles.chipRow, { marginTop: spacing.sm }]}>
            {item.tags.map((tag) => (
              <Chip
                key={tag}
                compact
                style={[styles.statusChip, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {tag}
                </Text>
              </Chip>
            ))}
          </View>
        )}
      </View>

      {/* Detail cards */}
      <View style={styles.section}>
        <View
          style={[
            detailCardStyles.container,
            { backgroundColor: theme.customColors.surfaceContainerLow },
          ]}
        >
          {item.category === ItemCategory.Consumable && item.remainingFraction !== undefined ? (
            <DetailCard
              icon="cup-outline"
              label={t('detail.remainingLabel')}
              value={t('detail.remainingValue', {
                percent: Math.round(item.remainingFraction * 100),
              })}
            />
          ) : (
            <DetailCard
              icon={CONDITION_ICONS[item.condition] ?? 'shield-check'}
              label={t('detail.conditionLabel')}
              value={t(`condition.${item.condition}`)}
            />
          )}
          {item.quantity > 1 && (
            <DetailCard
              icon="package-variant"
              label={t('detail.quantityLabel')}
              value={t('detail.quantityValue', { count: item.quantity })}
            />
          )}
          {item.age && (
            <DetailCard
              icon="calendar-month-outline"
              label={t('detail.ageLabel')}
              value={t(`form.ageOption.${item.age}`, { defaultValue: item.age })}
            />
          )}
          {item.usageKm !== undefined && (
            <DetailCard
              icon="road-variant"
              label={t('detail.usageLabel')}
              value={`${item.usageKm} ${distanceUnit}`}
            />
          )}
          {item.storageLocation && (
            <DetailCard
              icon="map-marker-outline"
              label={t('detail.storageLabel')}
              value={item.storageLocation}
            />
          )}
        </View>
      </View>

      {/* Technical Specifications */}
      {(item.brand || item.model) && (
        <View style={styles.section}>
          <Text
            variant="labelMedium"
            style={[styles.sectionHeader, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('detail.specsTitle', { defaultValue: 'TECHNICAL SPECIFICATIONS' })}
          </Text>
          <View style={styles.specsTable}>
            {item.brand && (
              <SpecRow label={t('form.brandLabel')} value={item.brand} theme={theme} />
            )}
            {item.model && (
              <SpecRow label={t('form.modelLabel')} value={item.model} theme={theme} />
            )}
          </View>
        </View>
      )}

      {/* Description */}
      {item.description && (
        <View style={styles.section}>
          <Text variant="bodyMedium" style={themed.onSurface}>
            {item.description}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={[styles.actionSection, isWide && styles.actionSectionWide]}>
        {canShowReturnedAction && onMarkReturned && (
          <ActionSlot isWide={isWide}>
            <GradientButton
              onPress={onMarkReturned}
              loading={markReturnedLoading}
              style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
            >
              {t('detail.markReturned')}
            </GradientButton>
          </ActionSlot>
        )}
        {canShowDonateAction && onMarkDonated && (
          <ActionSlot isWide={isWide}>
            <Button
              mode="outlined"
              onPress={onMarkDonated}
              style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
            >
              {t('detail.markDonated')}
            </Button>
          </ActionSlot>
        )}
        {canShowSoldAction && onMarkSold && (
          <ActionSlot isWide={isWide}>
            <Button
              mode="outlined"
              onPress={onMarkSold}
              style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
            >
              {t('detail.markSold')}
            </Button>
          </ActionSlot>
        )}
        {item.status === ItemStatus.Archived && onUnarchive && (
          <ActionSlot isWide={isWide}>
            <GradientButton
              onPress={onUnarchive}
              style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
            >
              {t('detail.unarchive')}
            </GradientButton>
          </ActionSlot>
        )}
        {onRemoveFromBin && (
          <ActionSlot isWide={isWide}>
            <Button
              mode="outlined"
              onPress={onRemoveFromBin}
              style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
            >
              {t('removeFromInventory')}
            </Button>
          </ActionSlot>
        )}
      </View>
    </>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isWide && styles.wideScrollContent]}
    >
      <View style={isWide ? styles.widePageInner : undefined}>
        <PhotoGallery photos={photos} maxGalleryWidth={isWide ? wideHeroGalleryMax : undefined} />
        {detailContent}
      </View>
    </ScrollView>
  );
}

function ActionSlot({
  isWide,
  fullWidth,
  children,
}: {
  isWide: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}) {
  if (!isWide) {
    return <>{children}</>;
  }
  return (
    <View style={[styles.actionGridCell, fullWidth && styles.actionGridCellFull]}>{children}</View>
  );
}

function SpecRow({ label, value, theme }: { label: string; value: string; theme: AppTheme }) {
  return (
    <View style={[styles.specRow, { borderBottomColor: theme.colors.outlineVariant + '40' }]}>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
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
      }),
    [theme],
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wideScrollContent: {
    flexGrow: 1,
  },
  widePageInner: {
    width: '100%',
    maxWidth: WIDE_PAGE_MAX_WIDTH,
    alignSelf: 'center',
  },
  content: {
    paddingBottom: spacing['2xl'],
  },
  section: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  actionSection: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  actionSectionWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  actionGridCell: {
    width: '48%',
  },
  actionGridCellFull: {
    width: '100%',
    alignItems: 'center',
  },
  breadcrumb: {
    letterSpacing: 1,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  title: {
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusChip: {
    borderRadius: borderRadius.full,
  },
  sectionHeader: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  specsTable: {
    gap: 0,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
  },
  actionButtonInGrid: {
    marginBottom: 0,
    width: '100%',
  },
});
