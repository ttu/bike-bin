import { useMemo } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Text, Chip, Button, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { GradientButton } from '@/shared/components/GradientButton';
import { useTranslation } from 'react-i18next';
import type { Item, ItemPhoto } from '@/shared/types';
import { ItemStatus } from '@/shared/types';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { getStatusColor, canDelete } from '../../utils/status';
import { PhotoGallery } from '@/shared/components';
import { useDistanceUnit } from '@/features/profile';

const WIDE_BREAKPOINT = 768;

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
  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= WIDE_BREAKPOINT;
  const { distanceUnit } = useDistanceUnit();

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
            styles.detailCardsContainer,
            { backgroundColor: theme.customColors.surfaceContainerLow },
          ]}
        >
          <DetailCard
            icon={CONDITION_ICONS[item.condition] ?? 'shield-check'}
            label={t('detail.conditionLabel')}
            value={t(`condition.${item.condition}`)}
            theme={theme}
          />
          {item.age && (
            <DetailCard
              icon="calendar-month-outline"
              label={t('detail.ageLabel')}
              value={t(`form.ageOption.${item.age}`, { defaultValue: item.age })}
              theme={theme}
            />
          )}
          {item.usageKm !== undefined && (
            <DetailCard
              icon="road-variant"
              label={t('detail.usageLabel')}
              value={`${item.usageKm} ${distanceUnit}`}
              theme={theme}
            />
          )}
          {item.storageLocation && (
            <DetailCard
              icon="map-marker-outline"
              label={t('detail.storageLabel')}
              value={item.storageLocation}
              theme={theme}
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
      <View style={styles.actionSection}>
        {canShowReturnedAction && onMarkReturned && (
          <GradientButton onPress={onMarkReturned} style={styles.actionButton}>
            {t('detail.markReturned')}
          </GradientButton>
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
            mode="text"
            onPress={onDelete}
            textColor={theme.colors.error}
            style={styles.actionButton}
          >
            {t('deleteItem')}
          </Button>
        )}
      </View>
    </>
  );

  if (isWide) {
    return (
      <View style={styles.wideContainer}>
        <View style={styles.wideGallery}>
          <PhotoGallery photos={photos} />
        </View>
        <ScrollView style={styles.wideDetails} contentContainerStyle={styles.content}>
          {detailContent}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PhotoGallery photos={photos} />
      {detailContent}
    </ScrollView>
  );
}

function DetailCard({
  icon,
  label,
  value,
  theme,
}: {
  icon: string;
  label: string;
  value: string;
  theme: AppTheme;
}) {
  return (
    <View style={styles.detailCard}>
      <View
        style={[
          styles.detailCardIcon,
          { backgroundColor: theme.customColors.surfaceContainerHighest },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as never}
          size={iconSize.md}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.detailCardText}>
        <Text
          variant="labelSmall"
          style={{
            color: theme.colors.onSurfaceVariant,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
          {value}
        </Text>
      </View>
    </View>
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
  wideContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  wideGallery: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.base,
  },
  wideDetails: {
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
  statusChip: {
    borderRadius: borderRadius.full,
  },
  detailCardsContainer: {
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    gap: spacing.md,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCardText: {
    flex: 1,
    gap: 2,
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
});
