import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { borderRadius, iconSize, spacing, type AppTheme } from '@/shared/theme';

interface DetailCardProps {
  icon: string;
  label: string;
  value: string;
}

export function DetailCard({ icon, label, value }: DetailCardProps) {
  const theme = useTheme<AppTheme>();

  const themed = useMemo(
    () =>
      StyleSheet.create({
        iconBg: { backgroundColor: theme.customColors.surfaceContainerHighest },
        label: {
          color: theme.colors.onSurfaceVariant,
        },
        value: { color: theme.colors.onSurface },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, themed.iconBg]}>
        <MaterialCommunityIcons
          name={icon as never}
          size={iconSize.md}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.text}>
        <Text variant="labelSmall" style={themed.label}>
          {label}
        </Text>
        <Text variant="bodyLarge" style={themed.value}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export const detailCardStyles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    gap: spacing.md,
  },
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
