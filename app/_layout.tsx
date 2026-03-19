import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { lightTheme, darkTheme } from '@/shared/theme';
import '@/shared/i18n/config';
import { queryClient } from '@/shared/api';
import { AuthProvider } from '@/features/auth';
import { DemoModeProvider } from '@/features/demo';
import { ThemePreferenceProvider, useThemePreference } from '@/shared/hooks/useThemePreference';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
});

function AppContent() {
  const { effectiveTheme } = useThemePreference();
  const theme = effectiveTheme === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <DemoModeProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </DemoModeProvider>
    </PaperProvider>
  );
}

function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemePreferenceProvider>
          <AppContent />
        </ThemePreferenceProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
