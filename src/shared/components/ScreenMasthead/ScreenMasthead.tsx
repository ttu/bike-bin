import { Fragment, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';
import { spacing } from '@/shared/theme';
import { Stamp, type StampTone } from '../Stamp/Stamp';

export interface ScreenMastheadCount {
  value: string | number;
  label: string;
  tone?: StampTone;
}

interface ScreenMastheadProps {
  eyebrow?: string;
  title: string;
  counts?: ScreenMastheadCount[];
}

export function ScreenMasthead({ eyebrow, title, counts }: ScreenMastheadProps) {
  const theme = useTheme<AppTheme>();

  const dynamicStyles = useMemo(
    () => ({
      title: { color: theme.colors.onBackground },
      countValue: {
        fontFamily: theme.fonts.displaySmall.fontFamily,
        fontWeight: theme.fonts.displaySmall.fontWeight,
      },
      figureAccent: { color: theme.customColors.accent },
      figureInk: { color: theme.colors.onBackground },
    }),
    [theme],
  );

  return (
    <View style={styles.container}>
      {eyebrow ? (
        <View style={styles.eyebrow}>
          <Stamp tone="dim">{eyebrow}</Stamp>
        </View>
      ) : null}
      <Text variant="displayLarge" style={[styles.title, dynamicStyles.title]}>
        {title.toUpperCase()}
      </Text>
      {counts && counts.length > 0 ? (
        <View style={styles.counts}>
          {counts.map((count, index) => (
            <Fragment key={`${count.label}-${index}`}>
              {index > 0 ? <View style={styles.countsSpacer} /> : null}
              <View style={styles.countItem}>
                <Text
                  style={[
                    styles.countValue,
                    dynamicStyles.countValue,
                    count.tone === 'accent' ? dynamicStyles.figureAccent : dynamicStyles.figureInk,
                  ]}
                >
                  {String(count.value)}
                </Text>
                <Stamp tone={count.tone ?? 'dim'}>{count.label}</Stamp>
              </View>
            </Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  eyebrow: {
    flexDirection: 'row',
  },
  title: {
    fontFamily: 'BigShoulders-Black',
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: 52,
  },
  counts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  countsSpacer: {
    width: spacing.base,
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  countValue: {
    fontSize: 22,
    lineHeight: 24,
  },
});
