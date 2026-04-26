import { useMemo, type ReactNode } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Text, Chip, Button, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { GradientButton } from '@/shared/components/GradientButton';
import { useTranslation } from 'react-i18next';
import type { DistanceUnit, Item, ItemPhoto } from '@/shared/types';
import { AvailabilityType, ItemCategory, ItemStatus } from '@/shared/types';
import { useGroup } from '@/features/groups';
import { spacing, borderRadius } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import type { AppTheme } from '@/shared/theme';
import { getStatusColor, type StatusColorToken } from '../../utils/status';
import { PhotoGallery } from '@/shared/components';
import { Stamp } from '@/shared/components/Stamp/Stamp';
import { DisplayFigure } from '@/shared/components/DisplayFigure';
import { useDistanceUnit } from '@/features/profile';
import { getWideDetailLayout, WIDE_DETAIL_PAGE_MAX_WIDTH } from '@/shared/utils/wideDetailLayout';
import { kmToDisplayUnit } from '@/shared/utils/distanceConversion';
import { availabilityTypesForList } from '../../utils/availabilityList';

const MIDDLE_DOT = ' · ';

interface ItemDetailProps {
  item: Item;
  photos: ItemPhoto[];
  onMarkDonated?: () => void;
  onMarkSold?: () => void;
  onMarkReturned?: () => void;
  markReturnedLoading?: boolean;
  onRemoveFromBin?: () => void;
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

  const categoryLabel = t(`category.${item.category}`);
  const subcategoryLabel = item.subcategory
    ? t(`subcategory.${item.subcategory}`, { defaultValue: item.subcategory })
    : undefined;

  const metaParts = [item.brand, item.model, item.age].filter(Boolean) as string[];
  const listAvailability = availabilityTypesForList(item.availabilityTypes);

  const detailContent = (
    <>
      <TitleBlock
        item={item}
        theme={theme}
        themed={themed}
        statusColor={statusColor}
        categoryLabel={categoryLabel}
        subcategoryLabel={subcategoryLabel}
        metaParts={metaParts}
        t={t}
      />
      <FigureStrip item={item} themed={themed} t={t} distanceUnit={distanceUnit} />
      <ServiceRecord item={item} themed={themed} theme={theme} t={t} />
      {item.description && (
        <View style={[styles.section, themed.sectionBorder]}>
          <Text variant="bodyMedium" style={themed.onBackground}>
            {item.description}
          </Text>
        </View>
      )}
      {item.storageLocation && (
        <View style={[styles.section, themed.sectionBorder]}>
          <View
            style={[
              styles.locationBlock,
              { backgroundColor: theme.customColors.surfaceContainerLow },
            ]}
          >
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={20}
              color={theme.colors.tertiary}
              style={styles.locationIcon}
            />
            <View style={styles.locationText}>
              <Text variant="titleSmall" style={themed.onBackground}>
                {item.storageLocation}
              </Text>
            </View>
          </View>
        </View>
      )}
      <ListedForSection
        listAvailability={listAvailability}
        ownerGroup={ownerGroup}
        themed={themed}
        t={t}
      />
      <ActionsSection
        item={item}
        isWide={isWide}
        t={t}
        canShowReturnedAction={canShowReturnedAction}
        canShowDonateAction={canShowDonateAction}
        canShowSoldAction={canShowSoldAction}
        onMarkReturned={onMarkReturned}
        onMarkDonated={onMarkDonated}
        onMarkSold={onMarkSold}
        onUnarchive={onUnarchive}
        onRemoveFromBin={onRemoveFromBin}
        markReturnedLoading={markReturnedLoading}
      />
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

type Themed = ReturnType<typeof useThemedStyles>;
type TFn = ReturnType<typeof useTranslation>['t'];

function TitleBlock({
  item,
  theme,
  themed,
  statusColor,
  categoryLabel,
  subcategoryLabel,
  metaParts,
  t,
}: {
  item: Item;
  theme: AppTheme;
  themed: Themed;
  statusColor: string;
  categoryLabel: string;
  subcategoryLabel: string | undefined;
  metaParts: string[];
  t: TFn;
}) {
  return (
    <View style={[styles.section, styles.sectionFirst, themed.sectionBorder]}>
      <View style={styles.chipRow}>
        {item.status !== ItemStatus.Stored && (
          <Chip
            compact
            style={[styles.titleChip, { backgroundColor: colorWithAlpha(statusColor, 0.12) }]}
          >
            <Text variant="labelSmall" style={{ color: statusColor }}>
              {t(`status.${item.status}`)}
            </Text>
          </Chip>
        )}
        <Chip
          compact
          style={[styles.titleChip, { backgroundColor: theme.customColors.surfaceContainerHigh }]}
        >
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {subcategoryLabel ?? categoryLabel}
          </Text>
        </Chip>
        {item.quantity > 1 && (
          <Chip
            compact
            style={[styles.titleChip, { backgroundColor: theme.customColors.surfaceContainerHigh }]}
          >
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {`×${item.quantity}`}
            </Text>
          </Chip>
        )}
      </View>
      <Text
        variant="displayLarge"
        style={[styles.title, themed.onBackground]}
        accessibilityRole="header"
      >
        {item.name}
      </Text>
      {metaParts.length > 0 && (
        <Text variant="bodyMedium" style={[styles.metaRow, themed.onSurfaceVariant]}>
          {metaParts.join(MIDDLE_DOT)}
        </Text>
      )}
      {item.tags.length > 0 && (
        <View style={[styles.chipRow, styles.tagRow]}>
          {item.tags.map((tag) => (
            <Chip
              key={tag}
              compact
              style={[styles.titleChip, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {tag}
              </Text>
            </Chip>
          ))}
        </View>
      )}
    </View>
  );
}

function FigureStrip({
  item,
  themed,
  t,
  distanceUnit,
}: {
  item: Item;
  themed: Themed;
  t: TFn;
  distanceUnit: DistanceUnit;
}) {
  const showRemaining =
    item.category === ItemCategory.Consumable && item.remainingFraction !== undefined;
  const showQuantity = item.quantity > 1;
  const showUsage = item.usageKm !== undefined;
  if (!showRemaining && !showQuantity && !showUsage) return null;
  return (
    <View style={[styles.section, themed.sectionBorder]}>
      <View style={styles.figureStrip}>
        {showRemaining && item.remainingFraction !== undefined && (
          <DisplayFigure
            value={String(Math.round(item.remainingFraction * 100))}
            unit="%"
            note={t('detail.remainingLabel')}
            size={28}
          />
        )}
        {showQuantity && (
          <DisplayFigure value={String(item.quantity)} note={t('detail.quantityLabel')} size={28} />
        )}
        {showUsage && item.usageKm !== undefined && (
          <DisplayFigure
            value={String(kmToDisplayUnit(item.usageKm, distanceUnit))}
            unit={distanceUnit}
            note={t('detail.usageLabel')}
            size={28}
          />
        )}
      </View>
    </View>
  );
}

function ServiceRecord({
  item,
  themed,
  theme,
  t,
}: {
  item: Item;
  themed: Themed;
  theme: AppTheme;
  t: TFn;
}) {
  const serviceRows: { label: string; value: string }[] = [
    { label: t('detail.conditionLabel'), value: t(`condition.${item.condition}`) },
  ];
  if (item.mountedDate) {
    serviceRows.push({ label: t('detail.mountedOnLabel'), value: item.mountedDate });
  }
  if (item.storageLocation) {
    serviceRows.push({ label: t('detail.storageLabel'), value: item.storageLocation });
  }
  return (
    <View style={[styles.section, themed.sectionBorder]}>
      <View style={styles.stampHeader}>
        <Stamp tone="dim">{t('detail.serviceRecord')}</Stamp>
      </View>
      <View style={styles.specsTable}>
        {serviceRows.map((row, index) => (
          <ServiceRow
            key={row.label}
            label={row.label}
            value={row.value}
            theme={theme}
            isLast={index === serviceRows.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

function ListedForSection({
  listAvailability,
  ownerGroup,
  themed,
  t,
}: {
  listAvailability: AvailabilityType[];
  ownerGroup: { name: string } | null | undefined;
  themed: Themed;
  t: TFn;
}) {
  if (listAvailability.length === 0 && !ownerGroup) return null;
  return (
    <View style={[styles.section, themed.sectionBorder]}>
      <View style={styles.stampHeader}>
        <Stamp tone="dim">{t('detail.listedFor')}</Stamp>
      </View>
      <View style={styles.chipRow}>
        {listAvailability.map((type) => (
          <Chip key={type} compact style={[styles.listingChip, themed.accentChipBg]}>
            <Text variant="labelSmall" style={themed.accentChipText}>
              {t(`availability.${type}`)}
            </Text>
          </Chip>
        ))}
        {ownerGroup && (
          <Chip compact icon="account-group" style={[styles.listingChip, themed.accentChipBg]}>
            <Text variant="labelSmall" style={themed.accentChipText}>
              {ownerGroup.name}
            </Text>
          </Chip>
        )}
      </View>
    </View>
  );
}

function ActionsSection({
  item,
  isWide,
  t,
  canShowReturnedAction,
  canShowDonateAction,
  canShowSoldAction,
  onMarkReturned,
  onMarkDonated,
  onMarkSold,
  onUnarchive,
  onRemoveFromBin,
  markReturnedLoading,
}: {
  item: Item;
  isWide: boolean;
  t: TFn;
  canShowReturnedAction: boolean;
  canShowDonateAction: boolean;
  canShowSoldAction: boolean;
  onMarkReturned?: () => void;
  onMarkDonated?: () => void;
  onMarkSold?: () => void;
  onUnarchive?: () => void;
  onRemoveFromBin?: () => void;
  markReturnedLoading: boolean;
}) {
  return (
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

function ServiceRow({
  label,
  value,
  theme,
  isLast = false,
}: Readonly<{
  label: string;
  value: string;
  theme: AppTheme;
  isLast?: boolean;
}>) {
  return (
    <View
      style={[
        styles.serviceRow,
        { borderBottomColor: theme.colors.outlineVariant },
        isLast && styles.serviceRowLast,
      ]}
    >
      <Text
        variant="bodyMedium"
        style={[styles.serviceLabel, { color: theme.colors.onSurfaceVariant }]}
      >
        {label}
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.serviceValue, { color: theme.colors.onBackground }]}
      >
        {value}
      </Text>
    </View>
  );
}

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onBackground: { color: theme.colors.onBackground },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        sectionBorder: { borderBottomColor: theme.colors.outlineVariant },
        accentChipBg: { backgroundColor: theme.customColors.accentTint },
        accentChipText: { color: theme.customColors.accent, fontWeight: '700' },
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
    paddingVertical: spacing.base,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagRow: {
    marginTop: spacing.sm,
    marginBottom: 0,
  },
  titleChip: {
    borderRadius: borderRadius.sm,
  },
  title: {
    fontFamily: 'BigShoulders-Black',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -1,
    lineHeight: 44,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  metaRow: {
    marginTop: 0,
  },
  figureStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stampHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  specsTable: {
    gap: 0,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  serviceRowLast: {
    borderBottomWidth: 0,
  },
  serviceLabel: {
    width: 110,
  },
  serviceValue: {
    flex: 1,
    fontWeight: '700',
  },
  locationBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  locationIcon: {
    marginTop: 2,
  },
  locationText: {
    flex: 1,
  },
  listingChip: {
    borderRadius: borderRadius.sm,
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
