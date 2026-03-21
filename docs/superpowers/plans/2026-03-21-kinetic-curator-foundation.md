# Kinetic Curator Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the app's visual foundation — theme colors, Manrope typography, and surface philosophy (no-line rule) — to match the Kinetic Curator design system.

**Architecture:** Three sequential layers: (1) theme token update in `theme.ts` + `app.json`, (2) Manrope font installation + Paper `configureFonts()`, (3) remove dividers/borders across 7 screen files and replace with tonal layering via spacing and background shifts.

**Tech Stack:** React Native Paper (MD3), expo-font, Manrope font, StyleSheet

**Spec:** `docs/superpowers/specs/2026-03-21-kinetic-curator-foundation-design.md`

---

## Chunk 1: Theme & Typography Foundation

### Task 1: Update theme color tokens

**Files:**

- Modify: `src/shared/theme/theme.ts`
- Modify: `src/shared/theme/__tests__/theme.test.ts`

- [ ] **Step 1: Update the theme test to expect new colors**

Update `src/shared/theme/__tests__/theme.test.ts`:

```typescript
import { lightTheme, darkTheme, spacing, borderRadius } from '../index';

describe('Theme', () => {
  it('defines light theme with Kinetic Curator primary', () => {
    expect(lightTheme.colors.primary).toBe('#006857');
  });

  it('defines dark theme with Kinetic Curator primary', () => {
    expect(darkTheme.colors.primary).toBe('#5ddbbe');
  });

  it('includes surface container tokens in light theme', () => {
    expect(lightTheme.customColors.surfaceContainerLowest).toBe('#ffffff');
    expect(lightTheme.customColors.surfaceContainerLow).toBe('#f1f4fa');
    expect(lightTheme.customColors.surfaceContainer).toBe('#ebeef4');
    expect(lightTheme.customColors.surfaceContainerHigh).toBe('#e5e8ee');
    expect(lightTheme.customColors.surfaceContainerHighest).toBe('#dfe3e8');
  });

  it('includes surface container tokens in dark theme', () => {
    expect(darkTheme.customColors.surfaceContainerLowest).toBe('#0b0f12');
    expect(darkTheme.customColors.surfaceContainerLow).toBe('#1a1e22');
    expect(darkTheme.customColors.surfaceContainerHigh).toBe('#252a2e');
  });

  it('includes tertiary colors for community features', () => {
    expect(lightTheme.colors.tertiary).toBe('#385d8c');
    expect(darkTheme.colors.tertiary).toBe('#a4c9fe');
  });

  it('defines spacing scale', () => {
    expect(spacing.base).toBe(16);
    expect(spacing.xs).toBe(4);
  });

  it('defines border radius tokens', () => {
    expect(borderRadius.md).toBe(12);
    expect(borderRadius.full).toBe(9999);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --testPathPattern="theme.test" --no-coverage`
Expected: FAIL — primary color mismatch and missing customColors properties

- [ ] **Step 3: Update CustomColors interface and theme objects**

Replace the full contents of `src/shared/theme/theme.ts`:

```typescript
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

const fontConfig = {
  fontFamily: 'Manrope-Regular',
} as const;

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --testPathPattern="theme.test" --no-coverage`
Expected: PASS — all assertions match new values

- [ ] **Step 5: Update app.json splash/icon colors**

In `app.json`, replace all occurrences of `#0D9488` with `#006857`:

- `splash.backgroundColor`: `"#0D9488"` → `"#006857"`
- `android.adaptiveIcon.backgroundColor`: `"#0D9488"` → `"#006857"`

- [ ] **Step 6: Commit**

```bash
git add src/shared/theme/theme.ts src/shared/theme/__tests__/theme.test.ts app.json
git commit -m "style: update theme to Kinetic Curator palette with expanded surface tokens"
```

---

### Task 2: Install Manrope font and configure loading

**Files:**

- Create: `assets/fonts/Manrope-Regular.ttf`
- Create: `assets/fonts/Manrope-Medium.ttf`
- Create: `assets/fonts/Manrope-SemiBold.ttf`
- Create: `assets/fonts/Manrope-Bold.ttf`
- Create: `assets/fonts/Manrope-ExtraBold.ttf`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Download Manrope font files**

```bash
mkdir -p assets/fonts
# Download from Google Fonts API
curl -L "https://github.com/nicholasjconn/google-fonts-to-local/raw/refs/heads/main/fonts/Manrope/Manrope-Regular.ttf" -o assets/fonts/Manrope-Regular.ttf
curl -L "https://github.com/nicholasjconn/google-fonts-to-local/raw/refs/heads/main/fonts/Manrope/Manrope-Medium.ttf" -o assets/fonts/Manrope-Medium.ttf
curl -L "https://github.com/nicholasjconn/google-fonts-to-local/raw/refs/heads/main/fonts/Manrope/Manrope-SemiBold.ttf" -o assets/fonts/Manrope-SemiBold.ttf
curl -L "https://github.com/nicholasjconn/google-fonts-to-local/raw/refs/heads/main/fonts/Manrope/Manrope-Bold.ttf" -o assets/fonts/Manrope-Bold.ttf
curl -L "https://github.com/nicholasjconn/google-fonts-to-local/raw/refs/heads/main/fonts/Manrope/Manrope-ExtraBold.ttf" -o assets/fonts/Manrope-ExtraBold.ttf
```

If the above URLs fail, use the `@expo-google-fonts/manrope` package instead:

```bash
npx expo install @expo-google-fonts/manrope expo-splash-screen
```

Then copy the `.ttf` files from `node_modules/@expo-google-fonts/manrope/` to `assets/fonts/`.

- [ ] **Step 2: Update root layout with font loading**

Replace `app/_layout.tsx` with:

```typescript
import { useCallback } from 'react';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { lightTheme, darkTheme } from '@/shared/theme';
import '@/shared/i18n/config';
import { queryClient } from '@/shared/api';
import { AuthProvider } from '@/features/auth';
import { DemoModeProvider } from '@/features/demo';
import { ThemePreferenceProvider, useThemePreference } from '@/shared/hooks/useThemePreference';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
});

SplashScreen.preventAutoHideAsync();

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
  const [fontsLoaded] = useFonts({
    'Manrope-Regular': require('../assets/fonts/Manrope-Regular.ttf'),
    'Manrope-Medium': require('../assets/fonts/Manrope-Medium.ttf'),
    'Manrope-SemiBold': require('../assets/fonts/Manrope-SemiBold.ttf'),
    'Manrope-Bold': require('../assets/fonts/Manrope-Bold.ttf'),
    'Manrope-ExtraBold': require('../assets/fonts/Manrope-ExtraBold.ttf'),
  });

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <ThemePreferenceProvider>
          <AppContent />
        </ThemePreferenceProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
```

- [ ] **Step 3: Verify the app builds**

Run: `npx expo export --platform web --no-minify 2>&1 | tail -5`
Expected: Build completes without font-related errors. (If expo-splash-screen is not installed, run `npx expo install expo-splash-screen` first.)

- [ ] **Step 4: Commit**

```bash
git add assets/fonts/ app/_layout.tsx package.json package-lock.json
git commit -m "style: install Manrope font and configure Paper typography"
```

---

## Chunk 2: Surface Philosophy — No-Line Rule

### Task 3: Remove tab bar border

**Files:**

- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Remove borderTop from tab bar style**

In `app/(tabs)/_layout.tsx`, remove the `borderTopColor` and `borderTopWidth` lines from `tabBarStyle`:

Replace:

```typescript
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
```

With:

```typescript
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: theme.colors.onSurface,
          shadowOffset: { width: 0, height: -12 },
          shadowOpacity: 0.06,
          shadowRadius: 24,
        },
```

Note: `borderTopWidth: 0` explicitly disables the default React Navigation border. Shadow uses `onSurface` for a tinted ambient shadow per the design spec.

- [ ] **Step 2: Commit**

```bash
git add app/(tabs)/_layout.tsx
git commit -m "style: remove tab bar border, use ambient tinted shadow"
```

---

### Task 4: Remove divider from messages list

**Files:**

- Modify: `app/(tabs)/messages/index.tsx`

- [ ] **Step 1: Remove Divider import and usage**

In `app/(tabs)/messages/index.tsx`:

1. Remove `Divider` from the import: change `import { Text, Divider, useTheme } from 'react-native-paper';` to `import { Text, useTheme } from 'react-native-paper';`

2. Remove the `ItemSeparatorComponent` prop: delete the line `ItemSeparatorComponent={() => <Divider />}`

3. Update `listContent` style to add gap for tonal spacing:

Replace:

```typescript
  listContent: {
    paddingBottom: spacing['2xl'],
  },
```

With:

```typescript
  listContent: {
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
```

- [ ] **Step 2: Commit**

```bash
git add app/(tabs)/messages/index.tsx
git commit -m "style: replace message list dividers with spacing gaps"
```

---

### Task 5: Remove chat input border

**Files:**

- Modify: `app/(tabs)/messages/[id].tsx`

- [ ] **Step 1: Remove borderTop from input bar**

In `app/(tabs)/messages/[id].tsx`:

1. In the inline style on the input bar `View` (line 207), remove `borderTopColor`:

Replace:

```typescript
          style={[
            styles.inputBar,
            { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline },
          ]}
```

With:

```typescript
          style={[
            styles.inputBar,
            { backgroundColor: theme.colors.surface },
          ]}
```

2. In the `inputBar` static style, remove `borderTopWidth`:

Replace:

```typescript
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
```

With:

```typescript
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/messages/[id].tsx"
git commit -m "style: remove chat input border, rely on tonal contrast"
```

---

### Task 6: Remove dividers from ItemDetail

**Files:**

- Modify: `src/features/inventory/components/ItemDetail/ItemDetail.tsx`

- [ ] **Step 1: Remove Divider import and usages**

In `src/features/inventory/components/ItemDetail/ItemDetail.tsx`:

1. Remove `Divider` from the import: change `import { Text, Chip, Button, Divider, useTheme } from 'react-native-paper';` to `import { Text, Chip, Button, useTheme } from 'react-native-paper';`

2. Remove both `<Divider />` elements (lines 78 and 123).

3. Remove `detailRowBorder` from `useThemedStyles`:

Replace:

```typescript
function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        detailRowBorder: { borderBottomColor: theme.colors.outline },
      }),
    [theme],
  );
}
```

With:

```typescript
function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
      }),
    [theme],
  );
}
```

4. In `DetailRow`, remove the `themed.detailRowBorder` style reference:

Replace:

```typescript
    <View style={[styles.detailRow, themed.detailRowBorder]}>
```

With:

```typescript
    <View style={styles.detailRow}>
```

5. Remove `borderBottomWidth` from the `detailRow` style:

Replace:

```typescript
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
```

With:

```typescript
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
```

Note: `paddingVertical` increased from `spacing.xs` (4) to `spacing.sm` (8) to compensate for the removed border — spacing replaces lines.

- [ ] **Step 2: Commit**

```bash
git add src/features/inventory/components/ItemDetail/ItemDetail.tsx
git commit -m "style: remove dividers and borders from ItemDetail, use spacing"
```

---

### Task 7: Remove dividers from ListingDetail

**Files:**

- Modify: `src/features/search/components/ListingDetail/ListingDetail.tsx`

- [ ] **Step 1: Remove Divider import and usages**

In `src/features/search/components/ListingDetail/ListingDetail.tsx`:

1. Remove `Divider` from the import: change `import { Text, Chip, Button, Divider, Avatar, useTheme } from 'react-native-paper';` to `import { Text, Chip, Button, Avatar, useTheme } from 'react-native-paper';`

2. Remove all three `<Divider />` elements (lines 75, 101, 137).

3. Remove `detailRowBorder` from `useThemedStyles`:

Replace:

```typescript
function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        primary: { color: theme.colors.primary },
        avatarBg: { backgroundColor: theme.colors.surfaceVariant },
        detailRowBorder: { borderBottomColor: theme.colors.outline },
      }),
    [theme],
  );
}
```

With:

```typescript
function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        primary: { color: theme.colors.primary },
        avatarBg: { backgroundColor: theme.colors.surfaceVariant },
      }),
    [theme],
  );
}
```

4. In `DetailRow`, remove `themed.detailRowBorder`:

Replace:

```typescript
    <View style={[styles.detailRow, themed.detailRowBorder]}>
```

With:

```typescript
    <View style={styles.detailRow}>
```

5. Remove `borderBottomWidth` from `detailRow` style and increase padding:

Replace:

```typescript
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
```

With:

```typescript
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
```

- [ ] **Step 2: Commit**

```bash
git add src/features/search/components/ListingDetail/ListingDetail.tsx
git commit -m "style: remove dividers and borders from ListingDetail, use spacing"
```

---

### Task 8: Remove dividers from GroupDetail

**Files:**

- Modify: `app/(tabs)/profile/groups/[id].tsx`

- [ ] **Step 1: Remove Divider import and usages**

In `app/(tabs)/profile/groups/[id].tsx`:

1. Remove `Divider` from the import: change the import line to remove `Divider`:

```typescript
import { Text, Button, Chip, TextInput, Switch, HelperText, useTheme } from 'react-native-paper';
```

2. Remove both `<Divider style={styles.divider} />` elements (lines 332 and 353).

3. Remove the `divider` style:

Replace:

```typescript
  divider: {
    marginVertical: spacing.base,
  },
```

With nothing (delete it entirely).

4. Add `gap: spacing.lg` to `detailContent` to create section spacing:

Replace:

```typescript
  detailContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
  },
```

With:

```typescript
  detailContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/profile/groups/[id].tsx"
git commit -m "style: remove dividers from GroupDetail, use section spacing"
```

---

### Task 9: Update ItemCard tonal background

**Files:**

- Modify: `src/features/inventory/components/ItemCard/ItemCard.tsx`

- [ ] **Step 1: Update card background to use surfaceContainerLowest**

In `src/features/inventory/components/ItemCard/ItemCard.tsx`, change the card background from `theme.colors.surface` to the new surface container token:

Replace:

```typescript
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
```

With:

```typescript
      style={[styles.container, { backgroundColor: theme.customColors.surfaceContainerLowest }]}
```

This makes cards "float" on the tonal surface hierarchy — white cards against the `#f7f9ff` surface background.

- [ ] **Step 2: Commit**

```bash
git add src/features/inventory/components/ItemCard/ItemCard.tsx
git commit -m "style: use surfaceContainerLowest for ItemCard tonal layering"
```

---

### Task 10: Update borrow requests tab border

**Files:**

- Modify: `app/(tabs)/profile/borrow-requests.tsx`

- [ ] **Step 1: Reduce tab bar border opacity**

In `app/(tabs)/profile/borrow-requests.tsx`, the tab bar bottom border is functional (active indicator). Keep it, but soften the container border.

The tab bar style at line 208 already uses `theme.colors.outlineVariant` which is fine. The `borderBottomWidth: 1` on line 273 stays as the design spec says to keep functional borders. No change needed here — the new `outlineVariant` color token (`#bccac4`) from the theme update already provides a softer appearance than the old `#CBD5E1`.

This task is a no-op — the theme color update in Task 1 handles this automatically.

- [ ] **Step 2: Commit (skip — no changes)**

No commit needed.

---

### Task 11: Run full validation

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: PASS — no lint errors from the changes

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS — CustomColors interface matches all usages

- [ ] **Step 3: Run tests**

Run: `npm run test -- --no-coverage`
Expected: PASS — all tests pass including updated theme test

- [ ] **Step 4: Final commit if any fixes were needed**

If lint/type-check required fixes, stage and commit them:

```bash
git add -A
git commit -m "fix: resolve lint/type issues from visual refresh"
```
