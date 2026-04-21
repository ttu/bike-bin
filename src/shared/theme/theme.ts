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
  // Oxidized orange accent — community seams only (groups, lending, messaging).
  // Never on primary CTAs. Rare editorial emphasis ("recently added", featured highlights).
  accent: string;
  accentContainer: string;
  onAccent: string;
  accentTint: string;
}

export interface AppTheme extends MD3Theme {
  customColors: CustomColors;
}

const fonts = configureFonts({
  config: {
    // Display & headline: Big Shoulders Display — condensed industrial, spec-sheet credibility
    // Negative tracking enforces the tight "stamped part number" feel; positive tracking spreads
    // the condensed letterforms and defeats the purpose of using a compressed face.
    displayLarge: {
      fontFamily: 'BigShoulders-Black',
      fontWeight: '900' as const,
      letterSpacing: -0.5,
    },
    displayMedium: {
      fontFamily: 'BigShoulders-ExtraBold',
      fontWeight: '800' as const,
      letterSpacing: -0.25,
    },
    displaySmall: {
      fontFamily: 'BigShoulders-ExtraBold',
      fontWeight: '800' as const,
      letterSpacing: 0,
    },
    headlineLarge: {
      fontFamily: 'BigShoulders-Bold',
      fontWeight: '700' as const,
      letterSpacing: 0,
    },
    headlineMedium: { fontFamily: 'BigShoulders-Bold', fontWeight: '700' as const },
    // UI text: Manrope — geometric workhorse
    headlineSmall: { fontFamily: 'Manrope-Bold', fontWeight: '700' as const },
    titleLarge: { fontFamily: 'Manrope-Bold', fontWeight: '700' as const },
    titleMedium: { fontFamily: 'Manrope-SemiBold', fontWeight: '600' as const },
    titleSmall: { fontFamily: 'Manrope-SemiBold', fontWeight: '600' as const },
    // Body: weight gradient from Medium → Regular as size decreases
    bodyLarge: { fontFamily: 'Manrope-Medium', fontWeight: '500' as const },
    bodyMedium: { fontFamily: 'Manrope-Regular', fontWeight: '400' as const },
    bodySmall: { fontFamily: 'Manrope-Regular', fontWeight: '400' as const },
    // Labels: weight gradient — Bold reserved for labelLarge (section headers, prominent UI);
    // smaller labels use lighter weights so chip text and metadata don't over-assert at 11–12sp.
    labelLarge: { fontFamily: 'Manrope-Bold', fontWeight: '700' as const },
    labelMedium: { fontFamily: 'Manrope-SemiBold', fontWeight: '600' as const },
    labelSmall: { fontFamily: 'Manrope-Medium', fontWeight: '500' as const },
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
    background: '#f5f2ec',
    surface: '#f5f2ec',
    surfaceVariant: '#e0dbd4',
    onBackground: '#1c1a17',
    onSurface: '#1c1a17',
    onSurfaceVariant: '#4a4640',
    outline: '#7a756e',
    outlineVariant: '#c7c1b8',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',
    onErrorContainer: '#93000a',
    inverseSurface: '#312e2b',
    inverseOnSurface: '#f0ede6',
    inversePrimary: '#5ddbbe',
  },
  customColors: {
    success: '#16A34A',
    warning: '#D97706',
    warningContainer: '#FFF3E0',
    surfaceContainerLowest: '#faf8f5',
    surfaceContainerLow: '#f0ede6',
    surfaceContainer: '#eae7e0',
    surfaceContainerHigh: '#e4e0d9',
    surfaceContainerHighest: '#dedad3',
    surfaceBright: '#f5f2ec',
    surfaceDim: '#d5d1ca',
    primaryFixedDim: '#5ddbbe',
    inverseSurface: '#312e2b',
    inverseOnSurface: '#f0ede6',
    inversePrimary: '#5ddbbe',
    accent: '#b8572e',
    accentContainer: '#e6c1ad',
    onAccent: '#ffffff',
    accentTint: 'rgba(184, 87, 46, 0.18)',
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
    background: '#141210',
    surface: '#141210',
    surfaceVariant: '#45413b',
    onBackground: '#e6e3dd',
    onSurface: '#e6e3dd',
    onSurfaceVariant: '#c4bfb6',
    outline: '#918b84',
    outlineVariant: '#45413b',
    error: '#ffb4ab',
    errorContainer: '#93000a',
    onError: '#690005',
    onErrorContainer: '#ffdad6',
    inverseSurface: '#e6e3dd',
    inverseOnSurface: '#312e2b',
    inversePrimary: '#006857',
  },
  customColors: {
    success: '#4ADE80',
    warning: '#FBBF24',
    warningContainer: '#4A3000',
    surfaceContainerLowest: '#0e0c0a',
    surfaceContainerLow: '#1e1b18',
    surfaceContainer: '#22201c',
    surfaceContainerHigh: '#2a2824',
    surfaceContainerHighest: '#353230',
    surfaceBright: '#3a3734',
    surfaceDim: '#141210',
    primaryFixedDim: '#3dbfa3',
    inverseSurface: '#e6e3dd',
    inverseOnSurface: '#312e2b',
    inversePrimary: '#006857',
    accent: '#e89868',
    accentContainer: '#5a2a10',
    onAccent: '#2a0f00',
    accentTint: 'rgba(232, 152, 104, 0.20)',
  },
};
