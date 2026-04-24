import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SocketBBMark } from '@/shared/components/SocketBBMark';
import { spacing } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';

interface BrandLockupProps {
  /** Mark size in px. Wordmark scales relative to this. Defaults to 40. */
  size?: number;
  /** Caption beneath the wordmark (e.g. "Workshop inventory · BB/001"). */
  caption?: string;
  /** Accessible label for the whole lockup. */
  accessibilityLabel?: string;
}

export function BrandLockup({ size = 40, caption, accessibilityLabel }: BrandLockupProps) {
  const theme = useTheme<AppTheme>();
  const wordmarkSize = Math.round(size * 0.85);
  const captionSize = Math.max(10, Math.round(size * 0.22));

  return (
    <View
      style={styles.row}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
    >
      <SocketBBMark size={size} />
      <View style={styles.text}>
        <Text
          style={[
            styles.wordmark,
            {
              color: theme.colors.onBackground,
              fontSize: wordmarkSize,
              lineHeight: wordmarkSize,
            },
          ]}
        >
          BIKE BIN
        </Text>
        {caption ? (
          <Text
            style={[
              styles.caption,
              {
                color: theme.colors.onSurfaceVariant,
                fontSize: captionSize,
              },
            ]}
          >
            {caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: 'BigShoulders-Black',
    fontWeight: '900',
    letterSpacing: -1.6,
  },
  caption: {
    fontFamily: 'Manrope-Bold',
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
});
