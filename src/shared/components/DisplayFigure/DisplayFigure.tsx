import { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { spacing, type AppTheme } from '@/shared/theme';

interface DisplayFigureProps {
  /** The numeric/spec value to display, e.g. "11-34", "40", "269" */
  value: string;
  /** Unit label rendered beside the value, e.g. "T", "%", "g", "km" */
  unit?: string;
  /** Descriptive note rendered below, e.g. "range", "wear". Expects already-translated string. */
  note?: string;
  /** Font size for the value. Default 32. Unit and note sizes are derived from this. */
  size?: number;
}

export function DisplayFigure({ value, unit, note, size = 32 }: Readonly<DisplayFigureProps>) {
  const theme = useTheme<AppTheme>();

  const dynamicStyles = useMemo(() => {
    const unitSize = Math.max(Math.round(size * 0.4), 11);
    const platformNumeric = Platform.select({
      web: { fontVariantNumeric: 'tabular-nums' } as Record<string, string>,
      default: {},
    });
    return {
      value: {
        fontSize: size,
        letterSpacing: size * -0.02,
        lineHeight: Math.round(size * 0.95),
        color: theme.colors.onBackground,
        ...platformNumeric,
      },
      unit: {
        fontSize: unitSize,
        color: theme.colors.onSurfaceVariant,
      },
      note: {
        color: theme.colors.onSurfaceVariant,
      },
    };
  }, [size, theme.colors]);

  return (
    <View style={styles.container}>
      <View style={styles.valueRow}>
        <Text style={[styles.value, dynamicStyles.value]}>{value}</Text>
        {unit && <Text style={[styles.unit, dynamicStyles.unit]}>{unit}</Text>}
      </View>
      {note && (
        <Text variant="labelSmall" style={[styles.note, dynamicStyles.note]}>
          {note}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  value: {
    fontFamily: 'BigShoulders-ExtraBold',
    fontWeight: '800',
  },
  unit: {
    fontFamily: 'Manrope-Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  note: {
    fontFamily: 'Manrope-SemiBold',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: spacing.xs / 2,
  },
});
