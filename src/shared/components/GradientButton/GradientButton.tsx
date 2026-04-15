import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AppTheme } from '@/shared/theme';
import { borderRadius } from '@/shared/theme';

interface GradientButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function GradientButton({
  children,
  onPress,
  disabled = false,
  loading = false,
  icon,
  style,
  accessibilityLabel,
  testID,
}: GradientButtonProps) {
  const theme = useTheme<AppTheme>();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
      style={({ pressed }) => [
        styles.wrapper,
        !isDisabled && styles.shadow,
        !isDisabled && { shadowColor: theme.colors.onSurface },
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <LinearGradient
        colors={
          isDisabled
            ? [theme.colors.surfaceVariant, theme.colors.surfaceVariant]
            : [theme.colors.primary, theme.colors.primaryContainer]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator
            color={isDisabled ? theme.colors.onSurfaceVariant : theme.colors.onPrimary}
            size="small"
          />
        ) : (
          <View style={styles.contentRow}>
            <Text
              variant="labelLarge"
              style={[
                styles.label,
                { color: isDisabled ? theme.colors.onSurfaceVariant : theme.colors.onPrimary },
              ]}
            >
              {children}
            </Text>
            {icon && (
              <MaterialCommunityIcons
                name={icon as never}
                size={20}
                color={isDisabled ? theme.colors.onSurfaceVariant : theme.colors.onPrimary}
                style={styles.icon}
              />
            )}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: borderRadius.md,
    overflow: 'hidden' as const,
  },
  gradient: {
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 24,
  },
  shadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  pressed: {
    opacity: 0.88,
  },
  contentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  label: {
    textTransform: 'uppercase' as const,
  },
  icon: {
    marginLeft: 4,
  },
});
