/**
 * Storybook canvas: isolated TanStack client per mount + Auth. Data must come
 * from the story file only (props/args, local fixtures, or `setQueryData` in
 * that story’s decorator — do not use the app `queryClient` or global demo seeders).
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth';
import { lightTheme } from '@/shared/theme';
import { ThemePreferenceProvider } from '@/shared/hooks/useThemePreference';
import { SnackbarAlertsProvider } from '@/shared/components/SnackbarAlerts';
import '@/shared/i18n/config';
import { createStorybookQueryClient } from './createStorybookQueryClient';

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export function StoryProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const queryClient = useMemo(() => createStorybookQueryClient(), []);

  return (
    <View style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemePreferenceProvider>
              <PaperProvider theme={lightTheme}>
                <SnackbarAlertsProvider>{children}</SnackbarAlertsProvider>
              </PaperProvider>
            </ThemePreferenceProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </View>
  );
}
