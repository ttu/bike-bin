import { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Chip, Button, Avatar, useTheme } from 'react-native-paper';
import { CachedAvatarImage } from '@/shared/components/CachedAvatarImage';
import { GradientButton } from '@/shared/components/GradientButton';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { formatDistance } from '@/shared/utils';
import { useAuth } from '@/features/auth';
import type { SearchResultItem } from '../../types';
import type { ItemPhoto } from '@/shared/types';
import { DetailCard, detailCardStyles, PhotoGallery } from '@/shared/components';

const CONDITION_ICONS: Record<string, string> = {
  new: 'shield-check',
  good: 'emoticon-happy-outline',
  worn: 'history',
  broken: 'close-circle-outline',
};

interface ListingDetailProps {
  item: SearchResultItem;
  photos: ItemPhoto[];
  onContact?: () => void;
  onRequestBorrow?: () => void;
  onOwnerPress?: () => void;
  onPhotoLongPress?: (photo: ItemPhoto) => void;
}

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

  const distanceText = formatDistance(item.distanceMeters);
  const durationText = item.borrowDuration
    ? t(`inventory:form.durationOption.${item.borrowDuration}`, {
        defaultValue: item.borrowDuration,
      })
    : undefined;

  const hasBorrowable = item.availabilityTypes.includes('borrowable' as never);
  const hasDonatable = item.availabilityTypes.includes('donatable' as never);
  const hasSellable = item.availabilityTypes.includes('sellable' as never);
  const hasContactable = hasDonatable || hasSellable;

  // Determine button layout per spec §3.12
  const showBorrowOnly = hasBorrowable && !hasContactable;
  const showContactOnly = hasContactable && !hasBorrowable;
  const showBoth = hasBorrowable && hasContactable;

  const categoryBreadcrumb = [t(`category.${item.category}`), item.brand]
    .filter(Boolean)
    .join(' \u00B7 ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Photo gallery */}
      <PhotoGallery
        photos={photos}
        onPhotoLongPress={
          onPhotoLongPress
            ? (p) => {
                const found = photos.find((x) => x.id === p.id);
                if (found) onPhotoLongPress(found);
              }
            : undefined
        }
      />

      {/* Category breadcrumb + Title */}
      <View style={styles.section}>
        <Text variant="labelSmall" style={[styles.breadcrumb, { color: theme.colors.primary }]}>
          {categoryBreadcrumb}
        </Text>

        <Text variant="headlineMedium" style={[styles.title, themed.onSurface]}>
          {item.name}
        </Text>

        {/* Availability chips */}
        {item.availabilityTypes.length > 0 && (
          <View style={styles.chipRow}>
            {item.availabilityTypes.map((type) => (
              <Chip
                key={type}
                compact
                style={[styles.availabilityChip, { backgroundColor: theme.colors.primary }]}
              >
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onPrimary, textTransform: 'uppercase' }}
                >
                  {t(`availability.${type}`)}
                  {type === 'sellable' && item.price !== undefined
                    ? ` \u00B7 \u20AC${item.price}`
                    : ''}
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
          <DetailCard
            icon={CONDITION_ICONS[item.condition] ?? 'shield-check'}
            label={t('listing.detail.conditionLabel')}
            value={t(`condition.${item.condition}`)}
          />
          {item.quantity > 1 && (
            <DetailCard
              icon="package-variant"
              label={t('listing.detail.quantityLabel')}
              value={t('listing.detail.quantityValue', { count: item.quantity })}
            />
          )}
          {durationText && (
            <DetailCard
              icon="clock-outline"
              label={t('listing.detail.ageLabel')}
              value={durationText ?? ''}
            />
          )}
        </View>
      </View>

      {/* Owner card */}
      <View style={styles.section}>
        <View
          style={[styles.ownerCard, { backgroundColor: theme.customColors.surfaceContainerLow }]}
        >
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
            <Text variant="titleSmall" style={themed.primary} onPress={onOwnerPress}>
              {item.ownerDisplayName ?? ''}
            </Text>
            {item.ownerRatingCount > 0 && (
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={14} color={theme.customColors.warning} />
                <Text variant="bodySmall" style={themed.onSurfaceVariant}>
                  {t('listing.ownerCard.rating', {
                    avg: item.ownerRatingAvg.toFixed(1),
                    count: item.ownerRatingCount,
                  })}
                </Text>
              </View>
            )}
          </View>
          <Text variant="labelSmall" style={themed.primary} onPress={onOwnerPress}>
            {t('listing.ownerCard.viewProfile')}
          </Text>
        </View>
      </View>

      {/* Location + distance */}
      {(item.areaName || distanceText) && (
        <View style={[styles.section, styles.locationRow]} testID="location-row">
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={iconSize.sm}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyMedium" style={themed.onSurfaceVariant}>
            {item.areaName ?? ''}
            {item.areaName && distanceText ? ' · ' : ''}
            {distanceText}
          </Text>
        </View>
      )}

      {/* Description */}
      {item.description ? (
        <View style={styles.section}>
          <Text variant="bodyMedium" style={themed.onSurface}>
            {item.description}
          </Text>
        </View>
      ) : null}

      {/* Action buttons */}
      <View style={styles.actionSection}>
        {!isAuthenticated ? (
          <GradientButton disabled style={styles.actionButton}>
            {t('listing.actions.signInToContact')}
          </GradientButton>
        ) : (
          <>
            {(showContactOnly || showBoth) && (
              <GradientButton onPress={onContact} disabled={!onContact} style={styles.actionButton}>
                {t('listing.actions.contact')}
              </GradientButton>
            )}
            {showBorrowOnly && (
              <GradientButton
                onPress={onRequestBorrow}
                disabled={!onRequestBorrow}
                style={styles.actionButton}
              >
                {t('listing.actions.requestBorrow')}
              </GradientButton>
            )}
            {showBoth && (
              <Button
                mode="outlined"
                onPress={onRequestBorrow}
                disabled={!onRequestBorrow}
                style={styles.actionButton}
              >
                {t('listing.actions.requestBorrow')}
              </Button>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        primary: { color: theme.colors.primary },
        avatarBg: { backgroundColor: theme.colors.surfaceVariant },
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
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  actionSection: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
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
  availabilityChip: {
    borderRadius: borderRadius.full,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
  },
});
