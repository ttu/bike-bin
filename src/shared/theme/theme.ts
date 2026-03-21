import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export interface CustomColors {
  success: string;
  warning: string;
  warningContainer: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceBright: string;
  surfaceDim: string;
  primaryFixedDim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

export interface AppTheme extends MD3Theme {
  customColors: CustomColors;
}

const fonts = configureFonts({
  config: {
    displayLarge: { fontFamily: 'Manrope-ExtraBold', fontWeight: '800' as const },
    displayMedium: { fontFamily: 'Manrope-ExtraBold', fontWeight: '800' as const },
    displaySmall: { fontFamily: 'Manrope-ExtraBold', fontWeight: '800' as const },
    headlineLarge: { fontFamily: 'Manrope-Bold', fontWeight: '700' as const },
    headlineMedium: { fontFamily: 'Manrope-Bold', fontWeight: '700' as const },
    headlineSmall: { fontFamily: 'Manrope-Bold', fontWeight: '700' as const },
    titleLarge: { fontFamily: 'Manrope-Bold', fontWeight: '700' as const },
    titleMedium: { fontFamily: 'Manrope-SemiBold', fontWeight: '600' as const },
    titleSmall: { fontFamily: 'Manrope-SemiBold', fontWeight: '600' as const },
    bodyLarge: { fontFamily: 'Manrope-Regular', fontWeight: '400' as const },
    bodyMedium: { fontFamily: 'Manrope-Regular', fontWeight: '400' as const },
    bodySmall: { fontFamily: 'Manrope-Regular', fontWeight: '400' as const },
    labelLarge: { fontFamily: 'Manrope-Bold', fontWeight: '700' as const },
    labelMedium: { fontFamily: 'Manrope-Bold', fontWeight: '700' as const },
    labelSmall: { fontFamily: 'Manrope-Bold', fontWeight: '700' as const },
  },
});

export const lightTheme: AppTheme = {
  ...MD3LightTheme,
  fonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#006857',
    onPrimary: '#ffffff',
    primaryContainer: '#00846e',
    onPrimaryContainer: '#f4fffa',
    secondary: '#486460',
    secondaryContainer: '#cae9e3',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#4d6a66',
    tertiary: '#385d8c',
    tertiaryContainer: '#5276a7',
    onTertiary: '#ffffff',
    onTertiaryContainer: '#fdfcff',
    background: '#f7f9ff',
    surface: '#f7f9ff',
    surfaceVariant: '#dfe3e8',
    onBackground: '#181c20',
    onSurface: '#181c20',
    onSurfaceVariant: '#3d4945',
    outline: '#6d7a75',
    outlineVariant: '#bccac4',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
    onErrorContainer: '#93000a',
    inverseSurface: '#2d3135',
    inverseOnSurface: '#eef1f7',
    inversePrimary: '#5ddbbe',
  },
  customColors: {
    success: '#16A34A',
    warning: '#D97706',
    warningContainer: '#FFF3E0',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f4fa',
    surfaceContainer: '#ebeef4',
    surfaceContainerHigh: '#e5e8ee',
    surfaceContainerHighest: '#dfe3e8',
    surfaceBright: '#f7f9ff',
    surfaceDim: '#d7dae0',
    primaryFixedDim: '#5ddbbe',
    inverseSurface: '#2d3135',
    inverseOnSurface: '#eef1f7',
    inversePrimary: '#5ddbbe',
  },
};

export const darkTheme: AppTheme = {
  ...MD3DarkTheme,
  fonts,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#5ddbbe',
    onPrimary: '#00382e',
    primaryContainer: '#005143',
    onPrimaryContainer: '#7cf8da',
    secondary: '#aecdc7',
    secondaryContainer: '#304c48',
    onSecondary: '#173431',
    onSecondaryContainer: '#cae9e3',
    tertiary: '#a4c9fe',
    tertiaryContainer: '#204876',
    onTertiary: '#003258',
    onTertiaryContainer: '#d4e3ff',
    background: '#101418',
    surface: '#101418',
    surfaceVariant: '#3d4945',
    onBackground: '#e2e5eb',
    onSurface: '#e2e5eb',
    onSurfaceVariant: '#bccac4',
    outline: '#8a938e',
    outlineVariant: '#3d4945',
    error: '#ffb4ab',
    errorContainer: '#93000a',
    onError: '#690005',
    onErrorContainer: '#ffdad6',
    inverseSurface: '#e2e5eb',
    inverseOnSurface: '#2d3135',
    inversePrimary: '#006857',
  },
  customColors: {
    success: '#4ADE80',
    warning: '#FBBF24',
    warningContainer: '#4A3000',
    surfaceContainerLowest: '#0b0f12',
    surfaceContainerLow: '#1a1e22',
    surfaceContainer: '#1e2226',
    surfaceContainerHigh: '#252a2e',
    surfaceContainerHighest: '#303539',
    surfaceBright: '#353a3f',
    surfaceDim: '#101418',
    primaryFixedDim: '#3dbfa3',
    inverseSurface: '#e2e5eb',
    inverseOnSurface: '#2d3135',
    inversePrimary: '#006857',
  },
};
