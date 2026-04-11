import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

type CenteredLoadingIndicatorProps = {
  /**
   * When true (default), expands to fill available space (e.g. list body while fetching).
   * When false, only centers the spinner in minimal vertical space.
   */
  fill?: boolean;
};

export function CenteredLoadingIndicator({ fill = true }: CenteredLoadingIndicatorProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');

  return (
    <View
      style={[styles.center, fill && styles.fill]}
      accessibilityRole="progressbar"
      accessibilityLabel={t('loading.a11y')}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} importantForAccessibility="no" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  fill: {
    flex: 1,
    minHeight: 120,
  },
});
