import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import type { TransactionType } from '@/shared/types';

interface ReviewCardProps {
  reviewerName: string | undefined;
  /** When true, show GDPR anonymized label instead of missing display name. */
  isDeletedReviewer?: boolean;
  score: number;
  text: string | undefined;
  transactionType: TransactionType;
  createdAt: string;
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
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      {/* Header: reviewer name + date */}
      <View style={styles.header}>
        <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
          {isDeletedReviewer ? tCommon('privacy.deletedUser') : (reviewerName ?? '')}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {formattedDate}
        </Text>
      </View>

      {/* Trust signal — sentence form replaces star row per design handoff */}
      <View style={styles.signalRow}>
        <Text variant="bodySmall" style={[styles.signal, { color: theme.customColors.accent }]}>
          {t('reviewSummary', { count: 1, onTime: score >= 4 ? 1 : 0 })}
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.transactionBadge, { color: theme.colors.onSurfaceVariant }]}
        >
          {transactionLabel}
        </Text>
      </View>

      {/* Comment text */}
      {text ? (
        <Text variant="bodyMedium" style={[styles.text, { color: theme.colors.onSurface }]}>
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
