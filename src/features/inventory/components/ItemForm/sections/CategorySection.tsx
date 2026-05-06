import { useMemo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Text, Chip, HelperText, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { AppTheme } from '@/shared/theme';
import { ItemCategory } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { SUBCATEGORY_ICONS } from '../../../constants';
import type { ItemFormState } from '../types';
import { styles } from '../styles';

const CATEGORIES = [
  ItemCategory.Component,
  ItemCategory.Tool,
  ItemCategory.Accessory,
  ItemCategory.Consumable,
  ItemCategory.Clothing,
];

interface CategorySectionProps {
  readonly state: ItemFormState;
}

export function CategorySection({ state }: CategorySectionProps) {
  const theme = useTheme<AppTheme>();
  const themed = useMemo(
    () =>
      StyleSheet.create({
        chipSelected: { backgroundColor: theme.colors.primary },
        chipUnselected: { backgroundColor: theme.colors.secondaryContainer },
        onPrimary: { color: theme.colors.onPrimary },
        onSurface: { color: theme.colors.onSurface },
        cardActive: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
          borderWidth: 2,
        },
        cardInactive: {
          backgroundColor: theme.customColors.surfaceContainerLow,
          borderColor: theme.colors.outlineVariant,
          borderWidth: 1,
        },
      }),
    [theme],
  );
  const { t } = useTranslation('inventory');
  const {
    category,
    handleCategoryChange,
    subcategory,
    setSubcategory,
    currentSubcategories,
    errors,
  } = state;

  return (
    <>
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.categoryLabel')}
      </Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <Chip
              key={cat}
              selected={active}
              onPress={() => handleCategoryChange(cat)}
              showSelectedCheck={false}
              textStyle={active ? themed.onPrimary : undefined}
              style={[styles.chip, active ? themed.chipSelected : themed.chipUnselected]}
            >
              {t(`category.${cat}`)}
            </Chip>
          );
        })}
      </View>
      {errors.category && (
        <HelperText type="error" visible>
          {errors.category}
        </HelperText>
      )}

      {category && currentSubcategories.length > 0 && (
        <>
          <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
            {t('form.subcategoryLabel')}
          </Text>
          <View style={styles.subcategoryGrid}>
            {currentSubcategories.map((sub) => {
              const active = subcategory === sub;
              const subIcon = SUBCATEGORY_ICONS[sub];
              return (
                <Pressable
                  key={sub}
                  onPress={() => setSubcategory(active ? '' : sub)}
                  style={[
                    styles.subcategoryCard,
                    styles.subcategoryCardLayout,
                    active ? themed.cardActive : themed.cardInactive,
                  ]}
                >
                  {Boolean(subIcon) && (
                    <MaterialCommunityIcons
                      name={subIcon as never}
                      size={22}
                      color={active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
                    />
                  )}
                  <Text variant="labelMedium" style={active ? themed.onPrimary : themed.onSurface}>
                    {t(`subcategory.${sub}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </>
  );
}
