import { useMemo } from 'react';
import { View, ScrollView, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Text, Chip, Button, useTheme } from 'react-native-paper';
import { GradientButton } from '@/shared/components/GradientButton';
import { useTranslation } from 'react-i18next';
import type { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import { spacing, borderRadius } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import type { AppTheme } from '@/shared/theme';
import type { SearchFilters } from '../../types';

interface FilterSheetProps {
  filters: SearchFilters;
  onFiltersChange: (partial: Partial<SearchFilters>) => void;
  onReset: () => void;
  onApply: () => void;
}

const CATEGORY_OPTIONS: ItemCategory[] = [
  'component',
  'tool',
  'accessory',
  'bike',
] as ItemCategory[];
const CONDITION_OPTIONS: ItemCondition[] = ['new', 'good', 'worn', 'broken'] as ItemCondition[];
const OFFER_TYPE_OPTIONS: AvailabilityType[] = [
  'borrowable',
  'donatable',
  'sellable',
] as AvailabilityType[];

export function FilterSheet({ filters, onFiltersChange, onReset, onApply }: FilterSheetProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('search');
  const themed = useThemedStyles(theme);

  const toggleChip = <T extends string>(list: T[], item: T, key: keyof SearchFilters) => {
    const next = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
    onFiltersChange({ [key]: next });
  };

  const showPriceRange = filters.offerTypes.includes('sellable' as AvailabilityType);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="titleLarge" style={themed.onSurface}>
          {t('filter.title')}
        </Text>
        <Button mode="text" onPress={onReset} compact>
          {t('filter.reset')}
        </Button>
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={[styles.sectionLabel, themed.onSurface]}>
          {t('filter.category')}
        </Text>
        <View style={styles.chipRow}>
          {CATEGORY_OPTIONS.map((cat) => {
            const active = filters.categories.includes(cat);
            return (
              <Chip
                key={cat}
                selected={active}
                onPress={() => toggleChip(filters.categories, cat, 'categories')}
                showSelectedCheck={false}
                textStyle={active ? { color: theme.colors.onPrimary } : undefined}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? theme.colors.primary
                      : theme.colors.secondaryContainer,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {t(`category.${cat}`)}
              </Chip>
            );
          })}
        </View>
      </View>

      {/* Condition */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={[styles.sectionLabel, themed.onSurface]}>
          {t('filter.condition')}
        </Text>
        <View style={styles.chipRow}>
          {CONDITION_OPTIONS.map((cond) => {
            const active = filters.conditions.includes(cond);
            return (
              <Chip
                key={cond}
                selected={active}
                onPress={() => toggleChip(filters.conditions, cond, 'conditions')}
                showSelectedCheck={false}
                textStyle={active ? { color: theme.colors.onPrimary } : undefined}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? theme.colors.primary
                      : theme.colors.secondaryContainer,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {t(`condition.${cond}`)}
              </Chip>
            );
          })}
        </View>
      </View>

      {/* Offer type */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={[styles.sectionLabel, themed.onSurface]}>
          {t('filter.offerType')}
        </Text>
        <View style={styles.chipRow}>
          {OFFER_TYPE_OPTIONS.map((offer) => {
            const active = filters.offerTypes.includes(offer);
            return (
              <Chip
                key={offer}
                selected={active}
                onPress={() => toggleChip(filters.offerTypes, offer, 'offerTypes')}
                showSelectedCheck={false}
                textStyle={active ? { color: theme.colors.onPrimary } : undefined}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? theme.colors.primary
                      : theme.colors.secondaryContainer,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {t(`availability.${offer}`)}
              </Chip>
            );
          })}
        </View>
      </View>

      {/* Price range (shown when Sell is selected) */}
      {showPriceRange && (
        <View style={styles.section}>
          <Text variant="titleSmall" style={[styles.sectionLabel, themed.onSurface]}>
            {t('filter.priceRange')}
          </Text>
          <View style={styles.priceRow}>
            <View style={[styles.priceInput, themed.outlineBorder, themed.priceInputBg]}>
              <Text variant="bodySmall" style={themed.onSurfaceVariant}>
                {t('filter.priceMin')}
              </Text>
              <RNTextInput
                value={filters.priceMin !== undefined ? String(filters.priceMin) : ''}
                onChangeText={(text) => {
                  const num = Number.parseFloat(text);
                  onFiltersChange({ priceMin: Number.isNaN(num) ? undefined : num });
                }}
                keyboardType="numeric"
                placeholder={'\u2014'}
                style={themed.priceInputText}
              />
            </View>
            <Text variant="bodyMedium" style={themed.onSurfaceVariant}>
              {'\u2013'}
            </Text>
            <View style={[styles.priceInput, themed.outlineBorder, themed.priceInputBg]}>
              <Text variant="bodySmall" style={themed.onSurfaceVariant}>
                {t('filter.priceMax')}
              </Text>
              <RNTextInput
                value={filters.priceMax !== undefined ? String(filters.priceMax) : ''}
                onChangeText={(text) => {
                  const num = Number.parseFloat(text);
                  onFiltersChange({ priceMax: Number.isNaN(num) ? undefined : num });
                }}
                keyboardType="numeric"
                placeholder={'\u2014'}
                style={themed.priceInputText}
              />
            </View>
          </View>
        </View>
      )}

      {/* Show results button */}
      <GradientButton
        onPress={onApply}
        style={styles.applyButton}
        accessibilityLabel={t('filter.showResults')}
      >
        {t('filter.showResults')}
      </GradientButton>
    </ScrollView>
  );
}

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        outlineBorder: { borderColor: colorWithAlpha(theme.colors.outlineVariant, 0.15) },
        priceInputBg: { backgroundColor: theme.customColors.surfaceContainerHighest },
        priceInputText: { color: theme.colors.onSurface, padding: 0 },
      }),
    [theme],
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 500,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  section: {
    marginBottom: spacing.base,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: borderRadius.full,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  applyButton: {
    marginTop: spacing.base,
    borderRadius: borderRadius.sm,
  },
});
