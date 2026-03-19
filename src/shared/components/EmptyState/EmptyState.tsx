import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing } from '@/shared/theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export function EmptyState({ icon, title, description, ctaLabel, onCtaPress }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.surfaceVariant }]}>
        <MaterialCommunityIcons
          name={icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
          size={40}
          color={theme.colors.onSurfaceVariant}
        />
      </View>
      <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
      >
        {description}
      </Text>
      {ctaLabel !== undefined && onCtaPress !== undefined && (
        <Button mode="contained" onPress={onCtaPress} style={styles.button}>
          {ctaLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.lg,
  },
});
