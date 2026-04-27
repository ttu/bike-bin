import { useMemo, type ReactNode } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Text, Chip, Button, Avatar, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { CachedAvatarImage } from '@/shared/components/CachedAvatarImage';
import { GradientButton } from '@/shared/components/GradientButton';
import { DetailCard, detailCardStyles, PhotoGallery } from '@/shared/components';
import { Stamp } from '@/shared/components/Stamp/Stamp';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import { formatDistance } from '@/shared/utils';
import { getWideDetailLayout, WIDE_DETAIL_PAGE_MAX_WIDTH } from '@/shared/utils/wideDetailLayout';
import { AvailabilityType, type ItemPhoto } from '@/shared/types';
import { useAuth } from '@/features/auth';
import type { SearchResultItem } from '../../types';
import { listingAvailabilityLayout } from '../../utils/listingAvailabilityLayout';

// Private is an implicit default and is never shown as a public-facing chip.
const visibleAvailabilityTypes = (types: AvailabilityType[]): AvailabilityType[] =>
  types.filter((type) => type !== AvailabilityType.Private);

const formatPrice = (price: number): string =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);

const MIDDLE_DOT = ' · ';

const CONDITION_ICONS: Record<string, string> = {
  new: 'shield-check',
  good: 'emoticon-happy-outline',
  worn: 'history',
  broken: 'close-circle-outline',
};

type ListingDetailProps = Readonly<{
  item: SearchResultItem;
  photos: ItemPhoto[];
  onContact?: () => void;
  onRequestBorrow?: () => void;
  onOwnerPress?: () => void;
  onPhotoLongPress?: (photo: ItemPhoto) => void;
}>;

export function ListingDetail({
  item,
  photos,
  onContact,
  onRequestBorrow,
  onOwnerPress,
  onPhotoLongPress,
}: ListingDetailProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation(['search', 'inventory']);
  const { isAuthenticated } = useAuth();
  const themed = useThemedStyles(theme);
  const { width: windowWidth } = useWindowDimensions();
  const { isWide, splitLayout, galleryMaxWidth } = getWideDetailLayout(windowWidth);

  const distanceText = formatDistance(item.distanceMeters);
  const durationText = item.borrowDuration
    ? t(`inventory:form.durationOption.${item.borrowDuration}`, {
        defaultValue: item.borrowDuration,
      })
    : undefined;

  const { showBorrowOnly, showContactOnly, showBoth } = listingAvailabilityLayout(
    item.availabilityTypes,
  );

  const categoryLabel = t(`search:category.${item.category}`);
  const metaParts = [item.brand, item.model].filter(Boolean) as string[];
  const listAvailability = visibleAvailabilityTypes(item.availabilityTypes);
  const hasLocation = Boolean(item.areaName || distanceText);

  const handlePhotoLongPress = onPhotoLongPress
    ? (p: { id: string }) => {
        const found = photos.find((x) => x.id === p.id);
        if (found) onPhotoLongPress(found);
      }
    : undefined;

  const detailContent = (
    <>
      <ListingTitleBlock
        item={item}
        theme={theme}
        themed={themed}
        categoryLabel={categoryLabel}
        metaParts={metaParts}
      />
      <ListingDetailStrip
        item={item}
        theme={theme}
        themed={themed}
        durationText={durationText}
        t={t}
      />
      <ListingOwnerCard
        item={item}
        theme={theme}
        themed={themed}
        t={t}
        onOwnerPress={onOwnerPress}
      />
      {item.description && (
        <View style={[styles.section, themed.sectionBorder]}>
          <Text variant="bodyMedium" style={themed.onBackground}>
            {item.description}
          </Text>
        </View>
      )}
      <ListingLocationRow
        hasLocation={hasLocation}
        item={item}
        theme={theme}
        themed={themed}
        distanceText={distanceText}
      />
      <ListingListedFor
        listAvailability={listAvailability}
        item={item}
        theme={theme}
        themed={themed}
        t={t}
      />
      <ListingActions
        isAuthenticated={isAuthenticated}
        isWide={isWide}
        showContactOnly={showContactOnly}
        showBorrowOnly={showBorrowOnly}
        showBoth={showBoth}
        onContact={onContact}
        onRequestBorrow={onRequestBorrow}
        t={t}
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
            <PhotoGallery
              photos={photos}
              maxGalleryWidth={galleryMaxWidth}
              onPhotoLongPress={handlePhotoLongPress}
            />
          </View>
          <View style={[styles.wideSplitRight, { borderLeftColor: theme.colors.outlineVariant }]}>
            {detailContent}
          </View>
        </View>
      ) : (
        <View style={isWide ? styles.widePageInner : undefined}>
          <PhotoGallery
            photos={photos}
            maxGalleryWidth={galleryMaxWidth}
            onPhotoLongPress={handlePhotoLongPress}
          />
          {detailContent}
        </View>
      )}
    </ScrollView>
  );
}

type Themed = ReturnType<typeof useThemedStyles>;
type TFn = ReturnType<typeof useTranslation>['t'];

function ListingTitleBlock({
  item,
  theme,
  themed,
  categoryLabel,
  metaParts,
}: {
  readonly item: SearchResultItem;
  readonly theme: AppTheme;
  readonly themed: Themed;
  readonly categoryLabel: string;
  readonly metaParts: string[];
}) {
  return (
    <View style={[styles.section, styles.sectionFirst, themed.sectionBorder]}>
      <View style={styles.chipRow}>
        <Chip
          compact
          style={[styles.titleChip, { backgroundColor: theme.customColors.surfaceContainerHigh }]}
        >
          <Text variant="labelSmall" style={themed.onSurfaceVariant}>
            {categoryLabel}
          </Text>
        </Chip>
        {item.quantity > 1 && (
          <Chip
            compact
            style={[styles.titleChip, { backgroundColor: theme.customColors.surfaceContainerHigh }]}
          >
            <Text variant="labelSmall" style={themed.onSurfaceVariant}>
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
    </View>
  );
}

function ListingDetailStrip({
  item,
  theme,
  themed,
  durationText,
  t,
}: {
  readonly item: SearchResultItem;
  readonly theme: AppTheme;
  readonly themed: Themed;
  readonly durationText: string | undefined;
  readonly t: TFn;
}) {
  return (
    <View style={[styles.section, themed.sectionBorder]}>
      <View
        style={[
          detailCardStyles.container,
          { backgroundColor: theme.customColors.surfaceContainerLow },
        ]}
      >
        <DetailCard
          icon={CONDITION_ICONS[item.condition] ?? 'shield-check'}
          label={t('search:listing.detail.conditionLabel')}
          value={t(`search:condition.${item.condition}`)}
        />
        {item.quantity > 1 && (
          <DetailCard
            icon="package-variant"
            label={t('search:listing.detail.quantityLabel')}
            value={t('search:listing.detail.quantityValue', { count: item.quantity })}
          />
        )}
        {durationText && (
          <DetailCard
            icon="clock-outline"
            label={t('search:listing.detail.durationLabel')}
            value={durationText}
          />
        )}
      </View>
    </View>
  );
}

function ListingOwnerCard({
  item,
  theme,
  themed,
  t,
  onOwnerPress,
}: {
  readonly item: SearchResultItem;
  readonly theme: AppTheme;
  readonly themed: Themed;
  readonly t: TFn;
  readonly onOwnerPress?: () => void;
}) {
  return (
    <View style={[styles.section, themed.sectionBorder]}>
      <View style={[styles.ownerCard, { backgroundColor: theme.customColors.surfaceContainerLow }]}>
        {item.ownerAvatarUrl ? (
          <CachedAvatarImage testID="owner-avatar-image" uri={item.ownerAvatarUrl} size={40} />
        ) : (
          <Avatar.Icon
            testID="owner-avatar-icon"
            size={40}
            icon="account"
            style={themed.avatarBg}
          />
        )}
        <View style={styles.ownerInfo}>
          <Text variant="titleSmall" style={themed.onBackground} onPress={onOwnerPress}>
            {item.ownerDisplayName ?? ''}
          </Text>
          {item.ownerRatingCount > 0 && (
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={14} color={theme.customColors.warning} />
              <Text variant="bodySmall" style={themed.onSurfaceVariant}>
                {t('search:listing.ownerCard.rating', {
                  avg: item.ownerRatingAvg.toFixed(1),
                  count: item.ownerRatingCount,
                })}
              </Text>
            </View>
          )}
        </View>
        <Text variant="labelSmall" style={themed.primary} onPress={onOwnerPress}>
          {t('search:listing.ownerCard.viewProfile')}
        </Text>
      </View>
    </View>
  );
}

function ListingLocationRow({
  hasLocation,
  item,
  theme,
  themed,
  distanceText,
}: {
  readonly hasLocation: boolean;
  readonly item: SearchResultItem;
  readonly theme: AppTheme;
  readonly themed: Themed;
  readonly distanceText: string | undefined;
}) {
  if (!hasLocation) return null;
  return (
    <View style={[styles.section, themed.sectionBorder]} testID="location-row">
      <View
        style={[styles.locationBlock, { backgroundColor: theme.customColors.surfaceContainerLow }]}
      >
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={20}
          color={theme.colors.tertiary}
          style={styles.locationIcon}
        />
        <View style={styles.locationText}>
          {item.areaName && (
            <Text variant="titleSmall" style={themed.onBackground}>
              {item.areaName}
            </Text>
          )}
          {distanceText && (
            <Text variant="bodyMedium" style={themed.onSurfaceVariant}>
              {distanceText}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function ListingListedFor({
  listAvailability,
  item,
  theme,
  themed,
  t,
}: {
  readonly listAvailability: AvailabilityType[];
  readonly item: SearchResultItem;
  readonly theme: AppTheme;
  readonly themed: Themed;
  readonly t: TFn;
}) {
  if (listAvailability.length === 0) return null;
  return (
    <View style={[styles.section, themed.sectionBorder]}>
      <View style={styles.stampHeader}>
        <Stamp tone="dim">{t('search:listing.listedFor')}</Stamp>
      </View>
      <View style={styles.chipRow}>
        {listAvailability.map((type) => {
          const label = t(`search:availability.${type}`);
          const suffix =
            type === AvailabilityType.Sellable && item.price !== undefined
              ? `${MIDDLE_DOT}${formatPrice(item.price)}`
              : '';
          return (
            <Chip
              key={type}
              compact
              style={[
                styles.listingChip,
                { backgroundColor: colorWithAlpha(theme.customColors.accent, 0.12) },
              ]}
            >
              <Text variant="labelSmall" style={themed.accentChipText}>
                {`${label}${suffix}`}
              </Text>
            </Chip>
          );
        })}
      </View>
    </View>
  );
}

function ListingActions({
  isAuthenticated,
  isWide,
  showContactOnly,
  showBorrowOnly,
  showBoth,
  onContact,
  onRequestBorrow,
  t,
}: {
  readonly isAuthenticated: boolean;
  readonly isWide: boolean;
  readonly showContactOnly: boolean;
  readonly showBorrowOnly: boolean;
  readonly showBoth: boolean;
  readonly onContact?: () => void;
  readonly onRequestBorrow?: () => void;
  readonly t: TFn;
}) {
  return (
    <View style={[styles.actionSection, isWide && styles.actionSectionWide]}>
      {isAuthenticated ? (
        <>
          {(showContactOnly || showBoth) && (
            <ActionSlot isWide={isWide}>
              <GradientButton
                onPress={onContact}
                disabled={!onContact}
                style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
              >
                {t('search:listing.actions.contact')}
              </GradientButton>
            </ActionSlot>
          )}
          {showBorrowOnly && (
            <ActionSlot isWide={isWide}>
              <GradientButton
                onPress={onRequestBorrow}
                disabled={!onRequestBorrow}
                style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
              >
                {t('search:listing.actions.requestBorrow')}
              </GradientButton>
            </ActionSlot>
          )}
          {showBoth && (
            <ActionSlot isWide={isWide}>
              <Button
                mode="outlined"
                onPress={onRequestBorrow}
                disabled={!onRequestBorrow}
                style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
              >
                {t('search:listing.actions.requestBorrow')}
              </Button>
            </ActionSlot>
          )}
        </>
      ) : (
        <ActionSlot isWide={isWide} fullWidth>
          <GradientButton
            disabled
            style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
          >
            {t('search:listing.actions.signInToContact')}
          </GradientButton>
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
  readonly isWide: boolean;
  readonly fullWidth?: boolean;
  readonly children: ReactNode;
}) {
  if (!isWide) {
    return <>{children}</>;
  }
  return (
    <View style={[styles.actionGridCell, fullWidth && styles.actionGridCellFull]}>{children}</View>
  );
}

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onBackground: { color: theme.colors.onBackground },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        primary: { color: theme.colors.primary },
        avatarBg: { backgroundColor: theme.colors.surfaceVariant },
        sectionBorder: { borderBottomColor: theme.colors.outlineVariant },
        accentChipText: { color: theme.customColors.accent, fontWeight: '700' },
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
  stampHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  ownerInfo: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
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
