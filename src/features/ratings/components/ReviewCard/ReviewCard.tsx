import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';
import type { TransactionType } from '@/shared/types';

interface ReviewCardProps {
  readonly reviewerName: string | undefined;
  /** When true, show GDPR anonymized label instead of missing display name. */
  readonly isDeletedReviewer?: boolean;
  readonly score: number;
  readonly text: string | undefined;
  readonly transactionType: TransactionType;
  readonly createdAt: string;
}

export function ReviewCard({
  reviewerName,
  isDeletedReviewer = false,
  score,
  text,
  transactionType,
  createdAt,
}: ReviewCardProps) {
  const theme = useTheme<AppTheme>();
  const themed = useMemo(
    () =>
      StyleSheet.create({
        container: { backgroundColor: theme.colors.surfaceVariant },
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        accent: { color: theme.customColors.accent },
      }),
    [theme],
  );
  const { t } = useTranslation('ratings');
  const { t: tCommon } = useTranslation('common');

  let transactionLabel: string;
  if (transactionType === 'borrow') {
    transactionLabel = t('review.transactionBorrow');
  } else if (transactionType === 'donate') {
    transactionLabel = t('review.transactionDonate');
  } else {
    transactionLabel = t('review.transactionSell');
  }

  const formattedDate = new Date(createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={[styles.container, themed.container]}>
      {/* Header: reviewer name + date */}
      <View style={styles.header}>
        <Text variant="labelLarge" style={themed.onSurface}>
          {isDeletedReviewer ? tCommon('privacy.deletedUser') : (reviewerName ?? '')}
        </Text>
        <Text variant="bodySmall" style={themed.onSurfaceVariant}>
          {formattedDate}
        </Text>
      </View>

      {/* Trust signal — sentence form replaces star row per design handoff */}
      <View style={styles.signalRow}>
        <Text variant="bodySmall" style={[styles.signal, themed.accent]}>
          {t('reviewSummary', { count: 1, onTime: score >= 4 ? 1 : 0 })}
        </Text>
        <Text variant="bodySmall" style={[styles.transactionBadge, themed.onSurfaceVariant]}>
          {transactionLabel}
        </Text>
      </View>

      {/* Comment text */}
      {text ? (
        <Text variant="bodyMedium" style={[styles.text, themed.onSurface]}>
          {text}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.base,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  signal: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  transactionBadge: {
    marginLeft: spacing.sm,
  },
  text: {
    marginTop: spacing.xs,
  },
});
