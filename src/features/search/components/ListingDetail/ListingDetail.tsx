import { View, ScrollView, useWindowDimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { PhotoGallery } from '@/shared/components';
import { type AppTheme } from '@/shared/theme';
import { formatDistance } from '@/shared/utils';
import { getWideDetailLayout } from '@/shared/utils/wideDetailLayout';
import { AvailabilityType, type ItemPhoto } from '@/shared/types';
import { useAuth } from '@/features/auth';
import type { SearchResultItem } from '../../types';
import { listingAvailabilityLayout } from '../../utils/listingAvailabilityLayout';
import { styles, useThemedStyles } from './shared';
import {
  ListingTitleBlock,
  ListingDetailStrip,
  ListingOwnerCard,
  ListingLocationRow,
  ListingListedFor,
  ListingActions,
} from './sections';

const visibleAvailabilityTypes = (types: AvailabilityType[]): AvailabilityType[] =>
  types.filter((type) => type !== AvailabilityType.Private);

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

  const distanceText = formatDistance(item.distanceMeters, t);
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
