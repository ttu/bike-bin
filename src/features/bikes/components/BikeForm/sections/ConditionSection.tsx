import { Pressable, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { ItemCondition } from '@/shared/types';
import { spacing, type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import { CONDITION_ICON, CONDITION_ICON_FALLBACK } from '@/shared/constants/conditionIcons';
import type { BikeFormState } from '../types';
import { styles } from '../styles';

const ITEM_CONDITIONS: readonly ItemCondition[] = [
  ItemCondition.New,
  ItemCondition.Good,
  ItemCondition.Worn,
  ItemCondition.Broken,
];

interface ConditionSectionProps {
  readonly state: BikeFormState;
}

export function ConditionSection({ state }: ConditionSectionProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('bikes');

  return (
    <>
      <View style={styles.conditionHeader}>
        <Text variant="labelLarge" style={styles.label}>
          {t('form.conditionLabel')}
        </Text>
        {state.condition && (
          <Text
            variant="labelMedium"
            style={[styles.conditionValue, { color: theme.colors.primary }]}
          >
            {t(`condition.${state.condition}`)}
          </Text>
        )}
      </View>
      <View style={styles.conditionRow}>
        {ITEM_CONDITIONS.map((cond) => {
          const active = state.condition === cond;
          return (
            <Pressable
              key={cond}
              onPress={() => state.setCondition(cond)}
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
    </>
  );
}
