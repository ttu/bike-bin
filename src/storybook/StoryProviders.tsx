import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lightTheme } from '@/shared/theme';
import { ThemePreferenceProvider } from '@/shared/hooks/useThemePreference';
import { DemoModeProvider } from '@/features/demo';
import { SnackbarAlertsProvider } from '@/shared/components/SnackbarAlerts';
import '@/shared/i18n/config';

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export function StoryProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <View style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <DemoModeProvider>
          <ThemePreferenceProvider>
            <PaperProvider theme={lightTheme}>
              <SnackbarAlertsProvider>{children}</SnackbarAlertsProvider>
            </PaperProvider>
          </ThemePreferenceProvider>
        </DemoModeProvider>
      </QueryClientProvider>
    </View>
  );
}
