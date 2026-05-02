import { View, ScrollView, useWindowDimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { AvailabilityType, ItemStatus, type Item, type ItemPhoto } from '@/shared/types';
import { useGroup } from '@/features/groups';
import { type AppTheme } from '@/shared/theme';
import { getStatusColor, type StatusColorToken } from '../../utils/status';
import { PhotoGallery } from '@/shared/components';
import { useDistanceUnit } from '@/features/profile';
import { getWideDetailLayout } from '@/shared/utils/wideDetailLayout';
import { availabilityTypesForList } from '../../utils/availabilityList';
import { styles, useThemedStyles } from './shared';
import {
  TitleBlock,
  FigureStrip,
  ServiceRecord,
  ListedForSection,
  ActionsSection,
} from './sections';

interface ItemDetailProps {
  readonly item: Item;
  readonly photos: ItemPhoto[];
  readonly onMarkDonated?: () => void;
  readonly onMarkSold?: () => void;
  readonly onMarkLoaned?: () => void;
  readonly onMarkReturned?: () => void;
  readonly markReturnedLoading?: boolean;
  readonly onRemoveFromBin?: () => void;
  readonly onUnarchive?: () => void;
}

export function ItemDetail({
  item,
  photos,
  onMarkDonated,
  onMarkSold,
  onMarkLoaned,
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
  const canShowLoanAction =
    (item.status === ItemStatus.Stored || item.status === ItemStatus.Mounted) &&
    item.availabilityTypes.includes(AvailabilityType.Borrowable);
  const canShowReturnedAction = item.status === ItemStatus.Loaned;

  const categoryLabel = t(`category.${item.category}`);
  const subcategoryLabel = item.subcategory
    ? t(`subcategory.${item.subcategory}`, { defaultValue: item.subcategory })
    : undefined;

  const ageLabel = item.age
    ? t(`form.ageOption.${item.age}`, { defaultValue: item.age })
    : undefined;
  const metaParts = [item.brand, item.model, ageLabel].filter(Boolean) as string[];
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
        canShowLoanAction={canShowLoanAction}
        onMarkReturned={onMarkReturned}
        onMarkDonated={onMarkDonated}
        onMarkSold={onMarkSold}
        onMarkLoaned={onMarkLoaned}
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
