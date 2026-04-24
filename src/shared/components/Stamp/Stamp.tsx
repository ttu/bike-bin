import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';

export type StampTone = 'ink' | 'dim' | 'accent';

interface StampProps {
  children: string;
  tone?: StampTone;
  size?: number;
}

function resolveStampColor(tone: StampTone, theme: AppTheme): string {
  if (tone === 'accent') return theme.customColors.accent;
  if (tone === 'dim') return theme.colors.onSurfaceVariant;
  return theme.colors.onBackground;
}

export function Stamp({ children, tone = 'ink', size = 10 }: Readonly<StampProps>) {
  const theme = useTheme<AppTheme>();

  const dynamicStyle = useMemo(
    () => ({ color: resolveStampColor(tone, theme), fontSize: size }),
    [tone, size, theme],
  );

  return <Text style={[styles.stamp, dynamicStyle]}>{children}</Text>;
}

const styles = StyleSheet.create({
  stamp: {
    fontFamily: 'Manrope-Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
