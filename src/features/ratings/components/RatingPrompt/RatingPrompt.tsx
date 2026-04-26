import { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, TextInput, Button, Portal, Modal, useTheme } from 'react-native-paper';
import { GradientButton } from '@/shared/components/GradientButton';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { borderRadius, iconSize, spacing, type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import type { TransactionType } from '@/shared/types';
import { RATING_WINDOW_DAYS } from '../../utils/ratingWindow';

interface RatingPromptProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (score: number, text?: string) => void;
  isSubmitting: boolean;
  itemName: string;
  userName: string;
  transactionType: TransactionType;
}

/**
 * Modal prompt shown after transaction completion to collect a user rating.
 * Displays context (item + user + transaction type), 1-5 star selector,
 * optional comment field, and Skip/Submit actions.
 */
export function RatingPrompt({
  visible,
  onDismiss,
  onSubmit,
  isSubmitting,
  itemName,
  userName,
  transactionType,
}: RatingPromptProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('ratings');

  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');

  const themeStyles = useMemo(
    () => ({
      modal: { backgroundColor: theme.colors.surface },
      context: { color: theme.colors.onSurfaceVariant },
      starLabel: { color: theme.colors.onSurfaceVariant },
      scoreLabel: { color: theme.colors.primary },
      note: { color: theme.colors.onSurfaceVariant },
      commentInput: {
        backgroundColor: theme.customColors.surfaceContainerHighest,
        borderRadius: borderRadius.md,
      },
    }),
    [
      theme.colors.surface,
      theme.colors.onSurfaceVariant,
      theme.colors.primary,
      theme.customColors.surfaceContainerHighest,
    ],
  );

  const handleSubmit = useCallback(() => {
    if (score < 1) return;
    onSubmit(score, comment.trim() || undefined);
  }, [score, comment, onSubmit]);

  const handleDismiss = useCallback(() => {
    setScore(0);
    setComment('');
    onDismiss();
  }, [onDismiss]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={[styles.modal, themeStyles.modal]}
      >
        {/* Title */}
        <Text variant="titleLarge" style={styles.title}>
          {t('prompt.title')}
        </Text>

        {/* Context */}
        <Text variant="bodyMedium" style={[styles.context, themeStyles.context]}>
          {t('prompt.context', { transactionType, itemName, userName })}
        </Text>

        {/* Star selector */}
        <Text variant="labelMedium" style={[styles.starLabel, themeStyles.starLabel]}>
          {t('prompt.starLabel')}
        </Text>
        <View style={styles.starsRow} accessibilityRole="radiogroup">
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              onPress={() => setScore(star)}
              accessibilityRole="radio"
              accessibilityState={{ selected: score === star }}
              accessibilityLabel={t(`stars.${star}` as 'stars.1')}
              testID={`star-${star}`}
            >
              <MaterialCommunityIcons
                name={star <= score ? 'star' : 'star-outline'}
                size={iconSize.xl}
                color={star <= score ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
            </Pressable>
          ))}
        </View>

        {/* Score label */}
        {score > 0 && (
          <Text variant="bodySmall" style={[styles.scoreLabel, themeStyles.scoreLabel]}>
            {t(`stars.${score}` as 'stars.1')}
          </Text>
        )}

        {/* Optional comment */}
        <TextInput
          mode="flat"
          label={t('prompt.commentLabel')}
          placeholder={t('prompt.commentPlaceholder')}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          style={[themeStyles.commentInput, styles.commentInput]}
          underlineColor={colorWithAlpha(theme.colors.outlineVariant, 0.15)}
          activeUnderlineColor={theme.colors.primary}
        />

        {/* Window note */}
        <Text variant="bodySmall" style={[styles.note, themeStyles.note]}>
          {t('prompt.windowNote', { days: RATING_WINDOW_DAYS })}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <Button mode="text" onPress={handleDismiss} disabled={isSubmitting}>
            {t('prompt.skip')}
          </Button>
          <GradientButton
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || score < 1}
            testID="submit-button"
          >
            {t('prompt.submit')}
          </GradientButton>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  context: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  starLabel: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  scoreLabel: {
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  commentInput: {
    marginBottom: spacing.sm,
  },
  note: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
