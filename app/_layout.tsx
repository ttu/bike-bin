import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  BigShouldersDisplay_700Bold,
  BigShouldersDisplay_800ExtraBold,
  BigShouldersDisplay_900Black,
} from '@expo-google-fonts/big-shoulders-display';
import { lightTheme, darkTheme } from '@/shared/theme';
import '@/shared/i18n/config';
import { queryClient } from '@/shared/api/queryClient';
import { storybookShellQueryClient } from '@/storybook/shellQueryClient';
import { AuthProvider } from '@/features/auth';
import { DemoModeProvider } from '@/features/demo';
import { ThemePreferenceProvider, useThemePreference } from '@/shared/hooks/useThemePreference';
import { SnackbarAlertsProvider } from '@/shared/components/SnackbarAlerts';
import { APP_ENV } from '@/shared/utils/env';
import { configureNavigationForWeb } from '@/shared/utils/configureNavigationForWeb';
import { getWebViewportStyle } from '@/shared/utils/webViewportStyle';
import StorybookUIRoot from '../.rnstorybook';

configureNavigationForWeb();

const storybookEnabled = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true';

const layoutStyles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  storybookRoot: { flex: 1 },
});

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (typeof sentryDsn === 'string' && sentryDsn.trim().length > 0) {
  Sentry.init({
    dsn: sentryDsn,
    environment: APP_ENV,
  });
}

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { effectiveTheme } = useThemePreference();
  const theme = effectiveTheme === 'dark' ? darkTheme : lightTheme;

  return (
    <GestureHandlerRootView style={[layoutStyles.gestureRoot, getWebViewportStyle()]}>
      <PaperProvider theme={theme}>
        <SnackbarAlertsProvider>
          <DemoModeProvider>
            <AuthProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </AuthProvider>
          </DemoModeProvider>
        </SnackbarAlertsProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

function StorybookAppContent() {
  return (
    <GestureHandlerRootView style={[layoutStyles.storybookRoot, getWebViewportStyle()]}>
      <SafeAreaProvider>
        <StorybookUIRoot />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
    'Manrope-ExtraBold': Manrope_800ExtraBold,
    'BigShoulders-Bold': BigShouldersDisplay_700Bold,
    'BigShoulders-ExtraBold': BigShouldersDisplay_800ExtraBold,
    'BigShoulders-Black': BigShouldersDisplay_900Black,
  });

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (storybookEnabled) {
    return (
      <SafeAreaProvider onLayout={onLayoutRootView} style={getWebViewportStyle()}>
        <QueryClientProvider client={storybookShellQueryClient}>
          <ThemePreferenceProvider>
            <StorybookAppContent />
          </ThemePreferenceProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView} style={getWebViewportStyle()}>
      <QueryClientProvider client={queryClient}>
        <ThemePreferenceProvider>
          <AppContent />
        </ThemePreferenceProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
