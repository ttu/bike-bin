import { View, Pressable } from 'react-native';
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
  category: ItemFormState['category'];
  handleCategoryChange: ItemFormState['handleCategoryChange'];
  subcategory: ItemFormState['subcategory'];
  setSubcategory: ItemFormState['setSubcategory'];
  currentSubcategories: ItemFormState['currentSubcategories'];
  errors: ItemFormState['errors'];
}

export function CategorySection({
  category,
  handleCategoryChange,
  subcategory,
  setSubcategory,
  currentSubcategories,
  errors,
}: CategorySectionProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');

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
              textStyle={active ? { color: theme.colors.onPrimary } : undefined}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.secondaryContainer,
                },
              ]}
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
                    {
                      flexBasis: '47%',
                      flexGrow: 1,
                      backgroundColor: active
                        ? theme.colors.primary
                        : theme.customColors.surfaceContainerLow,
                      borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                      borderWidth: active ? 2 : 1,
                    },
                  ]}
                >
                  {subIcon && (
                    <MaterialCommunityIcons
                      name={subIcon as never}
                      size={22}
                      color={active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
                    />
                  )}
                  <Text
                    variant="labelMedium"
                    style={{
                      color: active ? theme.colors.onPrimary : theme.colors.onSurface,
                    }}
                  >
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
