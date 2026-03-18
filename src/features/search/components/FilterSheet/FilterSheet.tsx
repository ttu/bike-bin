import { View, ScrollView, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Text, Chip, Button, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';

interface FilterSheetProps {
  categories: ItemCategory[];
  onCategoriesChange: (categories: ItemCategory[]) => void;
  conditions: ItemCondition[];
  onConditionsChange: (conditions: ItemCondition[]) => void;
  offerTypes: AvailabilityType[];
  onOfferTypesChange: (types: AvailabilityType[]) => void;
  priceMin?: number;
  priceMax?: number;
  onPriceMinChange: (value: number | undefined) => void;
  onPriceMaxChange: (value: number | undefined) => void;
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

export function FilterSheet({
  categories,
  onCategoriesChange,
  conditions,
  onConditionsChange,
  offerTypes,
  onOfferTypesChange,
  priceMin,
  priceMax,
  onPriceMinChange,
  onPriceMaxChange,
  onReset,
  onApply,
}: FilterSheetProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('search');

  const toggleChip = <T extends string>(list: T[], item: T, setter: (items: T[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const showPriceRange = offerTypes.includes('sellable' as AvailabilityType);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
          {t('filter.title')}
        </Text>
        <Button mode="text" onPress={onReset} compact>
          {t('filter.reset')}
        </Button>
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
          {t('filter.category')}
        </Text>
        <View style={styles.chipRow}>
          {CATEGORY_OPTIONS.map((cat) => {
            const active = categories.includes(cat);
            return (
              <Chip
                key={cat}
                selected={active}
                onPress={() => toggleChip(categories, cat, onCategoriesChange)}
                style={[active && { backgroundColor: theme.colors.primaryContainer }]}
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
        <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
          {t('filter.condition')}
        </Text>
        <View style={styles.chipRow}>
          {CONDITION_OPTIONS.map((cond) => {
            const active = conditions.includes(cond);
            return (
              <Chip
                key={cond}
                selected={active}
                onPress={() => toggleChip(conditions, cond, onConditionsChange)}
                style={[active && { backgroundColor: theme.colors.primaryContainer }]}
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
        <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
          {t('filter.offerType')}
        </Text>
        <View style={styles.chipRow}>
          {OFFER_TYPE_OPTIONS.map((offer) => {
            const active = offerTypes.includes(offer);
            return (
              <Chip
                key={offer}
                selected={active}
                onPress={() => toggleChip(offerTypes, offer, onOfferTypesChange)}
                style={[active && { backgroundColor: theme.colors.primaryContainer }]}
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
          <Text
            variant="titleSmall"
            style={[styles.sectionLabel, { color: theme.colors.onSurface }]}
          >
            {t('filter.priceRange')}
          </Text>
          <View style={styles.priceRow}>
            <View style={[styles.priceInput, { borderColor: theme.colors.outline }]}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('filter.priceMin')}
              </Text>
              <RNTextInput
                value={priceMin !== undefined ? String(priceMin) : ''}
                onChangeText={(text) => {
                  const num = parseFloat(text);
                  onPriceMinChange(isNaN(num) ? undefined : num);
                }}
                keyboardType="numeric"
                placeholder="\u2014"
                style={{ color: theme.colors.onSurface, padding: 0 }}
              />
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {'\u2013'}
            </Text>
            <View style={[styles.priceInput, { borderColor: theme.colors.outline }]}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('filter.priceMax')}
              </Text>
              <RNTextInput
                value={priceMax !== undefined ? String(priceMax) : ''}
                onChangeText={(text) => {
                  const num = parseFloat(text);
                  onPriceMaxChange(isNaN(num) ? undefined : num);
                }}
                keyboardType="numeric"
                placeholder="\u2014"
                style={{ color: theme.colors.onSurface, padding: 0 }}
              />
            </View>
          </View>
        </View>
      )}

      {/* Show results button */}
      <Button
        mode="contained"
        onPress={onApply}
        style={styles.applyButton}
        accessibilityLabel={t('filter.showResults')}
      >
        {t('filter.showResults')}
      </Button>
    </ScrollView>
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  applyButton: {
    marginTop: spacing.base,
    borderRadius: borderRadius.sm,
  },
});
