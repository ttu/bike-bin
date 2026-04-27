import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { borderRadius, iconSize, spacing, type AppTheme } from '@/shared/theme';

const BUTTON_HEIGHT = 48;

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
  const backgroundColor = isDisabled ? theme.colors.surfaceVariant : theme.colors.primary;
  const foregroundColor = isDisabled ? theme.colors.onSurfaceVariant : theme.colors.onPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foregroundColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          <Text variant="labelLarge" style={{ color: foregroundColor }}>
            {children}
          </Text>
          {icon && (
            <MaterialCommunityIcons
              name={icon as never}
              size={iconSize.sm}
              color={foregroundColor}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: BUTTON_HEIGHT,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.88,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
