import { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Avatar, Button, useTheme } from 'react-native-paper';
import { GradientButton } from '@/shared/components/GradientButton';
import { CachedAvatarImage } from '@/shared/components/CachedAvatarImage';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '@/shared/utils';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import type { BorrowRequestWithDetails } from '../../types';
import type { UserId } from '@/shared/types';
import { BorrowRequestStatus } from '@/shared/types';
import { getRequestActions, type RequestAction } from '../../utils/borrowWorkflow';

interface BorrowRequestCardProps {
  request: BorrowRequestWithDetails;
  currentUserId: UserId;
  onAccept?: (request: BorrowRequestWithDetails) => void;
  onDecline?: (request: BorrowRequestWithDetails) => void;
  onCancel?: (request: BorrowRequestWithDetails) => void;
  onMarkReturned?: (request: BorrowRequestWithDetails) => void;
  onPress?: (request: BorrowRequestWithDetails) => void;
}

export const BorrowRequestCard = memo(function BorrowRequestCard({
  request,
  currentUserId,
  onAccept,
  onDecline,
  onCancel,
  onMarkReturned,
  onPress,
}: BorrowRequestCardProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('borrow');

  const isIncoming = request.itemOwnerId === currentUserId;
  const actions = getRequestActions(request, currentUserId, request.itemOwnerId, {
    status: request.itemStatus,
    ownerId: request.itemOwnerId,
  });

  const personName = isIncoming ? request.requesterName : request.ownerName;
  const personAvatarUrl = isIncoming ? request.requesterAvatarUrl : request.ownerAvatarUrl;
  const personLabel = isIncoming
    ? t('card.requestedBy', { name: personName ?? '?' })
    : t('card.requestedFrom', { name: personName ?? '?' });

  const statusColor = getStatusColor(request.status, theme);

  const handleAction = (action: RequestAction) => {
    switch (action) {
      case 'accept':
        onAccept?.(request);
        break;
      case 'decline':
        onDecline?.(request);
        break;
      case 'cancel':
        onCancel?.(request);
        break;
      case 'markReturned':
        onMarkReturned?.(request);
        break;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <Pressable
        onPress={() => onPress?.(request)}
        style={({ pressed }) => [
          styles.pressableContent,
          actions.length === 0 && { paddingBottom: spacing.base },
          pressed && { backgroundColor: theme.colors.surfaceVariant },
        ]}
        accessibilityLabel={`${t('card.itemLabel', { itemName: request.itemName })} - ${personLabel}`}
        accessibilityRole="button"
      >
        {/* Header row: avatar + person info + status badge */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {personAvatarUrl ? (
              <CachedAvatarImage uri={personAvatarUrl} size={40} />
            ) : (
              <Avatar.Icon
                size={40}
                icon="account"
                style={{ backgroundColor: theme.colors.surfaceVariant }}
              />
            )}
          </View>

          <View style={styles.headerContent}>
            <Text variant="titleSmall" numberOfLines={1} style={{ color: theme.colors.onSurface }}>
              {personLabel}
            </Text>
            <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.primary }}>
              {request.itemName}
            </Text>
          </View>

          <View
            style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}
            testID="status-badge"
          >
            <Text variant="labelSmall" style={{ color: statusColor.text }}>
              {t(`card.status.${request.status}`)}
            </Text>
          </View>
        </View>

        {/* Optional message */}
        {request.message && (
          <Text
            variant="bodySmall"
            numberOfLines={2}
            style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('card.message', { message: request.message })}
          </Text>
        )}

        {/* Timestamp */}
        <Text
          variant="labelSmall"
          style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('card.requestedAt', { time: formatRelativeTime(request.createdAt) })}
        </Text>
      </Pressable>

      {/* Action buttons — outside the Pressable to avoid nested <button> on web */}
      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.includes('accept') && (
            <GradientButton
              onPress={() => handleAction('accept')}
              style={styles.actionButton}
              testID="accept-button"
            >
              {t('actions.accept')}
            </GradientButton>
          )}
          {actions.includes('decline') && (
            <Button
              mode="outlined"
              compact
              onPress={() => handleAction('decline')}
              style={styles.actionButton}
              testID="decline-button"
            >
              {t('actions.decline')}
            </Button>
          )}
          {actions.includes('cancel') && (
            <Button
              mode="outlined"
              compact
              onPress={() => handleAction('cancel')}
              style={styles.actionButton}
              testID="cancel-button"
            >
              {t('actions.cancel')}
            </Button>
          )}
          {actions.includes('markReturned') && (
            <GradientButton
              onPress={() => handleAction('markReturned')}
              style={styles.actionButton}
              testID="mark-returned-button"
            >
              {t('actions.markReturned')}
            </GradientButton>
          )}
        </View>
      )}
    </View>
  );
});

function getStatusColor(
  status: BorrowRequestStatus,
  theme: AppTheme,
): { bg: string; text: string } {
  switch (status) {
    case BorrowRequestStatus.Pending:
      return { bg: theme.colors.secondaryContainer, text: theme.colors.onSecondaryContainer };
    case BorrowRequestStatus.Accepted:
      return { bg: theme.colors.primaryContainer, text: theme.colors.onPrimaryContainer };
    case BorrowRequestStatus.Rejected:
      return { bg: theme.colors.errorContainer, text: theme.colors.onErrorContainer };
    case BorrowRequestStatus.Returned:
      return { bg: theme.colors.surfaceVariant, text: theme.colors.onSurfaceVariant };
    case BorrowRequestStatus.Cancelled:
      return { bg: theme.colors.surfaceVariant, text: theme.colors.onSurfaceVariant };
    default:
      return { bg: theme.colors.surfaceVariant, text: theme.colors.onSurfaceVariant };
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  pressableContent: {
    padding: spacing.base,
    paddingBottom: 0,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    flexShrink: 0,
  },
  headerContent: {
    flex: 1,
    gap: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  message: {
    paddingLeft: spacing.xs,
    fontStyle: 'italic',
  },
  timestamp: {
    paddingLeft: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  actionButton: {
    flex: 0,
  },
});
