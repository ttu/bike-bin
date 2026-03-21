import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AppTheme } from '@/shared/theme';

interface GradientButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function GradientButton({
  children,
  onPress,
  disabled = false,
  loading = false,
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
          <Text
            variant="labelLarge"
            style={[
              styles.label,
              { color: isDisabled ? theme.colors.onSurfaceVariant : theme.colors.onPrimary },
            ]}
          >
            {children}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  gradient: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 24,
  },
  shadow: {
    shadowColor: '#181c20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    textTransform: 'uppercase' as const,
  },
});
