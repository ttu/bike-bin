import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, iconSize } from '@/shared/theme';
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
  const theme = useTheme();
  const { t } = useTranslation('ratings');
  const { t: tCommon } = useTranslation('common');

  const transactionLabel =
    transactionType === 'borrow'
      ? t('review.transactionBorrow')
      : transactionType === 'donate'
        ? t('review.transactionDonate')
        : t('review.transactionSell');

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

      {/* Stars */}
      <View style={styles.starsRow} accessibilityLabel={t('review.starLabel', { score })}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={star <= score ? 'star' : 'star-outline'}
            size={iconSize.sm}
            color={star <= score ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
        ))}
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
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: spacing.xs,
  },
  transactionBadge: {
    marginLeft: spacing.sm,
  },
  text: {
    marginTop: spacing.xs,
  },
});
