import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Chip, Button, Divider, Avatar, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { useAuth } from '@/features/auth';
import type { SearchResultItem } from '../../types';
import type { ItemPhoto } from '@/shared/types';
import { PhotoGallery } from '@/features/inventory/components/PhotoGallery/PhotoGallery';

interface ListingDetailProps {
  item: SearchResultItem;
  photos: ItemPhoto[];
  onContact?: () => void;
  onRequestBorrow?: () => void;
  onOwnerPress?: () => void;
}

export function ListingDetail({
  item,
  photos,
  onContact,
  onRequestBorrow,
  onOwnerPress,
}: ListingDetailProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('search');
  const { isAuthenticated } = useAuth();

  const distanceText = formatDistance(item.distanceMeters);

  const hasBorrowable = item.availabilityTypes.includes('borrowable' as never);
  const hasDonatable = item.availabilityTypes.includes('donatable' as never);
  const hasSellable = item.availabilityTypes.includes('sellable' as never);
  const hasContactable = hasDonatable || hasSellable;

  // Determine button layout per spec §3.12
  const showBorrowOnly = hasBorrowable && !hasContactable;
  const showContactOnly = hasContactable && !hasBorrowable;
  const showBoth = hasBorrowable && hasContactable;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Photo gallery */}
      <PhotoGallery photos={photos} />

      {/* Title + subtitle */}
      <View style={styles.section}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
          {item.name}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t(`category.${item.category}`)}
          {item.brand ? ` · ${item.brand}` : ''}
          {item.condition ? ` · ${t(`condition.${item.condition}`)}` : ''}
        </Text>
      </View>

      {/* Availability chips */}
      {item.availabilityTypes.length > 0 && (
        <View style={[styles.section, styles.chipRow]}>
          {item.availabilityTypes.map((type) => (
            <Chip key={type} compact>
              {t(`availability.${type}`)}
              {type === 'sellable' && item.price !== undefined ? ` · \u20AC${item.price}` : ''}
            </Chip>
          ))}
        </View>
      )}

      <Divider />

      {/* Owner card */}
      <View style={[styles.section, styles.ownerCard]}>
        <Avatar.Icon
          size={40}
          icon="account"
          style={{ backgroundColor: theme.colors.surfaceVariant }}
        />
        <View style={styles.ownerInfo}>
          <Text variant="titleSmall" style={{ color: theme.colors.primary }} onPress={onOwnerPress}>
            {item.ownerDisplayName ?? ''}
          </Text>
          {item.ownerRatingCount > 0 && (
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={14} color={theme.customColors.warning} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('listing.ownerCard.rating', {
                  avg: item.ownerRatingAvg.toFixed(1),
                  count: item.ownerRatingCount,
                })}
              </Text>
            </View>
          )}
        </View>
        <Text variant="labelSmall" style={{ color: theme.colors.primary }} onPress={onOwnerPress}>
          {t('listing.ownerCard.viewProfile')}
        </Text>
      </View>

      <Divider />

      {/* Location + distance */}
      <View style={[styles.section, styles.locationRow]}>
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={iconSize.sm}
          color={theme.colors.onSurfaceVariant}
        />
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {item.areaName ?? ''}
          {item.areaName && distanceText ? ' · ' : ''}
          {distanceText}
        </Text>
      </View>

      {/* Description */}
      {item.description ? (
        <View style={styles.section}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {item.description}
          </Text>
        </View>
      ) : null}

      {/* Detail grid */}
      <View style={[styles.section, styles.detailGrid]}>
        <DetailRow
          label={t('listing.detail.conditionLabel')}
          value={t(`condition.${item.condition}`)}
        />
        {item.borrowDuration ? (
          <DetailRow label={t('listing.detail.ageLabel')} value={item.borrowDuration} />
        ) : null}
      </View>

      <Divider />

      {/* Action buttons */}
      <View style={styles.section}>
        {!isAuthenticated ? (
          <Button mode="contained" onPress={() => {}} disabled style={styles.actionButton}>
            {t('listing.actions.signInToContact')}
          </Button>
        ) : (
          <>
            {(showContactOnly || showBoth) && (
              <Button mode="contained" onPress={onContact} disabled style={styles.actionButton}>
                {t('listing.actions.contact')} ({t('listing.actions.comingSoon')})
              </Button>
            )}
            {(showBorrowOnly || showBoth) && (
              <Button
                mode={showBoth ? 'outlined' : 'contained'}
                onPress={onRequestBorrow}
                disabled
                style={styles.actionButton}
              >
                {t('listing.actions.requestBorrow')} ({t('listing.actions.comingSoon')})
              </Button>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
        {value}
      </Text>
    </View>
  );
}

function formatDistance(meters: number | undefined): string {
  if (meters === undefined) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
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
  title: {
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderBottomColor: '#E2E8F0',
  },
  actionButton: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
  },
});
