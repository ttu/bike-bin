import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { AppTheme } from '@/shared/theme';
import { spacing, borderRadius, iconSize } from '@/shared/theme';

interface DetailCardProps {
  icon: string;
  label: string;
  value: string;
}

export function DetailCard({ icon, label, value }: DetailCardProps) {
  const theme = useTheme<AppTheme>();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.customColors.surfaceContainerHighest },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as never}
          size={iconSize.md}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.text}>
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
