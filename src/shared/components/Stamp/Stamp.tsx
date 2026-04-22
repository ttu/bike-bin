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

export function Stamp({ children, tone = 'ink', size = 10 }: StampProps) {
  const theme = useTheme<AppTheme>();

  const dynamicStyle = useMemo(() => {
    const color =
      tone === 'accent'
        ? theme.customColors.accent
        : tone === 'dim'
          ? theme.colors.onSurfaceVariant
          : theme.colors.onBackground;
    return { color, fontSize: size };
  }, [tone, size, theme]);

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
