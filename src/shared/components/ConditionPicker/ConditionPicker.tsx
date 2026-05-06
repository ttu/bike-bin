import { Pressable, StyleSheet, View } from 'react-native';
import { HelperText, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import { CONDITION_ICON, CONDITION_ICON_FALLBACK } from '@/shared/constants/conditionIcons';
import { ItemCondition } from '@/shared/types';

const CONDITIONS: readonly ItemCondition[] = [
  ItemCondition.New,
  ItemCondition.Good,
  ItemCondition.Worn,
  ItemCondition.Broken,
];

export interface ConditionPickerProps {
  readonly condition: ItemCondition | undefined;
  readonly onConditionChange: (condition: ItemCondition) => void;
  readonly headerLabel: string;
  readonly conditionLabel: (condition: ItemCondition) => string;
  readonly error?: string;
}

export function ConditionPicker({
  condition,
  onConditionChange,
  headerLabel,
  conditionLabel,
  error,
}: ConditionPickerProps) {
  const theme = useTheme<AppTheme>();

  return (
    <>
      <View style={styles.header}>
        <Text variant="labelLarge" style={styles.label}>
          {headerLabel}
        </Text>
        {condition && (
          <Text variant="labelMedium" style={[styles.value, { color: theme.colors.primary }]}>
            {conditionLabel(condition)}
          </Text>
        )}
      </View>
      <View style={styles.row}>
        {CONDITIONS.map((cond) => {
          const active = condition === cond;
          return (
            <Pressable
              key={cond}
              onPress={() => onConditionChange(cond)}
              style={[
                styles.button,
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
                style={[
                  styles.buttonLabel,
                  { color: active ? theme.colors.primary : theme.colors.onSurfaceVariant },
                ]}
              >
                {conditionLabel(cond)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error && (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  value: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  buttonLabel: {
    marginTop: spacing.xs,
  },
});
