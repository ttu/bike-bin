import { ScrollView, StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ItemCategory } from '@/shared/types';
import { spacing } from '@/shared/theme';

const CATEGORIES = [
  undefined,
  ItemCategory.Component,
  ItemCategory.Tool,
  ItemCategory.Accessory,
  ItemCategory.Consumable,
];

interface CategoryFilterProps {
  selected: ItemCategory | undefined;
  onSelect: (category: ItemCategory | undefined) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const theme = useTheme();
  const { t } = useTranslation('inventory');

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((cat) => {
        const isActive = selected === cat;
        const label = cat ? t(`category.${cat}`) : t('category.all');
        return (
          <Chip
            key={label}
            compact
            selected={isActive}
            onPress={() => onSelect(cat)}
            style={[styles.chip, isActive && { backgroundColor: theme.colors.primaryContainer }]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            {label}
          </Chip>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    height: 36,
  },
});
