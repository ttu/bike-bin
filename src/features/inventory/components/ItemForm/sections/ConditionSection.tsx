import { View, Pressable } from 'react-native';
import { Text, HelperText, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import { ItemCondition } from '@/shared/types';
import { CONDITION_ICON, CONDITION_ICON_FALLBACK } from '@/shared/constants/conditionIcons';
import { useTranslation } from 'react-i18next';
import type { ItemFormState } from '../types';
import { styles } from '../styles';

const CONDITIONS = [
  ItemCondition.New,
  ItemCondition.Good,
  ItemCondition.Worn,
  ItemCondition.Broken,
];

interface ConditionSectionProps {
  readonly condition: ItemFormState['condition'];
  readonly setCondition: ItemFormState['setCondition'];
  readonly errors: ItemFormState['errors'];
}

export function ConditionSection({ condition, setCondition, errors }: ConditionSectionProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');

  return (
    <>
      <View style={styles.conditionHeader}>
        <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
          {t('form.conditionLabel')}
        </Text>
        {condition && (
          <Text
            variant="labelMedium"
            style={[styles.conditionValue, { color: theme.colors.primary }]}
          >
            {t(`condition.${condition}`)}
          </Text>
        )}
      </View>
      <View style={styles.conditionRow}>
        {CONDITIONS.map((cond) => {
          const active = condition === cond;
          return (
            <Pressable
              key={cond}
              onPress={() => setCondition(cond)}
              style={[
                styles.conditionButton,
                {
                  backgroundColor: active
                    ? colorWithAlpha(theme.colors.primary, 0.08)
                    : theme.customColors.surfaceContainerLow,
                  borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                  borderWidth: active ? 2 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={(CONDITION_ICON[cond] ?? CONDITION_ICON_FALLBACK) as never}
                size={28}
                color={active ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <Text
                variant="labelSmall"
                style={{
                  color: active ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  marginTop: spacing.xs,
                }}
              >
                {t(`condition.${cond}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {errors.condition && (
        <HelperText type="error" visible>
          {errors.condition}
        </HelperText>
      )}
    </>
  );
}
