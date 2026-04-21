import { View, StyleSheet, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';
import { spacing } from '@/shared/theme';

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

export function DisplayFigure({ value, unit, note, size = 32 }: DisplayFigureProps) {
  const theme = useTheme<AppTheme>();
  const unitSize = Math.max(Math.round(size * 0.4), 11);
  const letterSpacing = size * -0.02;
  const lineHeight = Math.round(size * 0.95);

  return (
    <View style={styles.container}>
      <View style={styles.valueRow}>
        <Text
          style={[
            styles.value,
            {
              fontSize: size,
              letterSpacing,
              lineHeight,
              color: theme.colors.onBackground,
              ...Platform.select({
                web: { fontVariantNumeric: 'tabular-nums' } as Record<string, string>,
                default: {},
              }),
            },
          ]}
        >
          {value}
        </Text>
        {unit && (
          <Text
            style={[
              styles.unit,
              {
                fontSize: unitSize,
                color: theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {unit}
          </Text>
        )}
      </View>
      {note && (
        <Text variant="labelSmall" style={[styles.note, { color: theme.colors.onSurfaceVariant }]}>
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
