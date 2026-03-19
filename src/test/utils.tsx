import React from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lightTheme } from '@/shared/theme';
import { ThemePreferenceProvider } from '@/shared/hooks/useThemePreference';
import '@/shared/i18n/config';

// SafeAreaProvider is excluded because jest-expo does not render it in tests.
// Wrap with it in app code only; use this util for component tests.

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemePreferenceProvider>
        <PaperProvider theme={lightTheme}>{children}</PaperProvider>
      </ThemePreferenceProvider>
    </QueryClientProvider>
  );
}

function renderWithProviders(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export { renderWithProviders };
