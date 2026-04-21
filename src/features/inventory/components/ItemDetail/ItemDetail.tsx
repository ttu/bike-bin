import { useMemo, type ReactNode } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Text, Chip, Button, useTheme } from 'react-native-paper';
import { GradientButton } from '@/shared/components/GradientButton';
import { useTranslation } from 'react-i18next';
import type { Item, ItemPhoto } from '@/shared/types';
import { AvailabilityType, ItemCategory, ItemStatus } from '@/shared/types';
import { useGroup } from '@/features/groups';
import { spacing, borderRadius } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import type { AppTheme } from '@/shared/theme';
import { getStatusColor, type StatusColorToken } from '../../utils/status';
import { DetailCard, detailCardStyles, PhotoGallery } from '@/shared/components';
import { DisplayFigure } from '@/shared/components/DisplayFigure';
import { useDistanceUnit } from '@/features/profile';
import { getWideDetailLayout, WIDE_DETAIL_PAGE_MAX_WIDTH } from '@/shared/utils/wideDetailLayout';
import { kmToDisplayUnit } from '@/shared/utils/distanceConversion';

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
  const { isWide, splitLayout, galleryMaxWidth } = getWideDetailLayout(windowWidth);
  const { distanceUnit } = useDistanceUnit();
  const { data: ownerGroup } = useGroup(item.groupId);

  const statusColorToken = getStatusColor(item.status);
  const statusColorMap: Record<StatusColorToken, string> = {
    warning: theme.customColors.warning,
    success: theme.customColors.success,
    outline: theme.colors.outline,
  };
  const statusColor = statusColorMap[statusColorToken];

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
      <View style={[styles.section, styles.sectionFirst, themed.sectionBorder]}>
        <Text variant="labelSmall" style={[styles.breadcrumb, { color: theme.colors.primary }]}>
          {categoryBreadcrumb}
        </Text>

        {/* Title */}
        <Text variant="headlineMedium" style={[styles.title, themed.onSurface]}>
          {item.name}
        </Text>

        {/* Group ownership indicator */}
        {ownerGroup && (
          <Chip
            compact
            icon="account-group"
            style={[styles.ownerChip, { backgroundColor: theme.colors.secondaryContainer }]}
          >
            <Text variant="labelSmall" style={{ color: theme.colors.onSecondaryContainer }}>
              {ownerGroup.name}
            </Text>
          </Chip>
        )}

        {/* Availability + Status chips */}
        <View style={styles.chipRow}>
          {item.availabilityTypes.map((type) => (
            <Chip
              key={type}
              compact
              style={[styles.statusChip, { backgroundColor: theme.colors.primary }]}
            >
              <Text variant="labelSmall" style={{ color: theme.colors.onPrimary }}>
                {t(`availability.${type}`)}
              </Text>
            </Chip>
          ))}
          {item.status !== ItemStatus.Stored && (
            <Chip
              compact
              style={[styles.statusChip, { backgroundColor: colorWithAlpha(statusColor, 0.12) }]}
            >
              <Text variant="labelSmall" style={{ color: statusColor }}>
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
      <View style={[styles.section, themed.sectionBorder]}>
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
              value={`${kmToDisplayUnit(item.usageKm, distanceUnit)} ${distanceUnit}`}
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

      {/* Spec figures — display-figure treatment */}
      <View style={[styles.section, themed.sectionBorder]}>
        <View style={styles.figureStrip}>
          {item.category === ItemCategory.Consumable && item.remainingFraction !== undefined && (
            <DisplayFigure
              value={String(Math.round(item.remainingFraction * 100))}
              unit="%"
              note={t('detail.remainingLabel')}
              size={28}
            />
          )}
          {item.quantity > 1 && (
            <DisplayFigure value={`×${item.quantity}`} note={t('detail.quantityLabel')} size={28} />
          )}
          {item.usageKm !== undefined && (
            <DisplayFigure
              value={String(kmToDisplayUnit(item.usageKm, distanceUnit))}
              unit={distanceUnit}
              note={t('detail.usageLabel')}
              size={28}
            />
          )}
        </View>
      </View>

      {/* Technical Specifications */}
      {(item.brand || item.model) && (
        <View style={[styles.section, themed.sectionBorder]}>
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
        <View style={[styles.section, themed.sectionBorder]}>
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
      contentContainerStyle={[
        styles.content,
        isWide && styles.wideScrollContent,
        splitLayout && styles.wideSplitScrollContent,
      ]}
    >
      {splitLayout ? (
        <View style={styles.wideSplitRow}>
          <View style={styles.wideSplitLeft}>
            <PhotoGallery photos={photos} maxGalleryWidth={galleryMaxWidth} />
          </View>
          <View style={[styles.wideSplitRight, { borderLeftColor: theme.colors.outlineVariant }]}>
            {detailContent}
          </View>
        </View>
      ) : (
        <View style={isWide ? styles.widePageInner : undefined}>
          <PhotoGallery photos={photos} maxGalleryWidth={galleryMaxWidth} />
          {detailContent}
        </View>
      )}
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
    <View style={[styles.specRow, { borderBottomColor: theme.colors.outlineVariant }]}>
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
        sectionBorder: { borderBottomColor: theme.colors.outlineVariant },
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
    maxWidth: WIDE_DETAIL_PAGE_MAX_WIDTH,
    alignSelf: 'center',
  },
  wideSplitScrollContent: {
    paddingHorizontal: spacing.base,
  },
  wideSplitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    width: '100%',
    maxWidth: WIDE_DETAIL_PAGE_MAX_WIDTH,
    alignSelf: 'center',
  },
  wideSplitLeft: {
    flex: 1,
    minWidth: 280,
  },
  wideSplitRight: {
    flex: 1,
    minWidth: 280,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingLeft: spacing.lg,
  },
  content: {
    paddingBottom: spacing['2xl'],
  },
  section: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionFirst: {
    paddingTop: spacing.base,
  },
  actionSection: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.base,
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
    marginBottom: spacing.xs,
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
  ownerChip: {
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
  },
  figureStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
  },
  sectionHeader: {
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
