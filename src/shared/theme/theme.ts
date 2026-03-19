import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export interface CustomColors {
  success: string;
  warning: string;
  warningContainer: string;
}

export interface AppTheme extends MD3Theme {
  customColors: CustomColors;
}

export const lightTheme: AppTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0D9488',
    onPrimary: '#FFFFFF',
    primaryContainer: '#CCFBF1',
    secondary: '#64748B',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceVariant: '#F1F5F9',
    outline: '#CBD5E1',
    error: '#DC2626',
    onBackground: '#0F172A',
    onSurface: '#1E293B',
    onSurfaceVariant: '#64748B',
  },
  customColors: {
    success: '#16A34A',
    warning: '#D97706',
    warningContainer: '#FFF3E0',
  },
};

export const darkTheme: AppTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#2DD4BF',
    onPrimary: '#042F2E',
    primaryContainer: '#134E4A',
    secondary: '#94A3B8',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    outline: '#475569',
    error: '#F87171',
    onBackground: '#F1F5F9',
    onSurface: '#E2E8F0',
    onSurfaceVariant: '#94A3B8',
  },
  customColors: {
    success: '#4ADE80',
    warning: '#FBBF24',
    warningContainer: '#4A3000',
  },
};
