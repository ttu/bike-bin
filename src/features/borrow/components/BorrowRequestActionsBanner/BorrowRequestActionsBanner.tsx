import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { GradientButton } from '@/shared/components/GradientButton';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { spacing, type AppTheme } from '@/shared/theme';
import { BorrowRequestStatus, type UserId } from '@/shared/types';
import type { BorrowRequestWithDetails } from '../../types';
import { getRequestActions } from '../../utils/borrowWorkflow';
import { useAcceptBorrowRequest } from '../../hooks/useAcceptBorrowRequest';
import { useDeclineBorrowRequest } from '../../hooks/useDeclineBorrowRequest';
import { useCancelBorrowRequest } from '../../hooks/useCancelBorrowRequest';
import { useMarkReturned } from '../../hooks/useMarkReturned';

interface BorrowRequestActionsBannerProps {
  readonly request: BorrowRequestWithDetails;
  readonly currentUserId: UserId;
}

function getContextKey(status: BorrowRequestStatus, isOwner: boolean): string | undefined {
  switch (status) {
    case BorrowRequestStatus.Pending:
      return isOwner ? 'banner.pending.owner' : 'banner.pending.requester';
    case BorrowRequestStatus.Accepted:
      return isOwner ? 'banner.accepted.owner' : 'banner.accepted.requester';
    default:
      return undefined;
  }
}

export function BorrowRequestActionsBanner({
  request,
  currentUserId,
}: BorrowRequestActionsBannerProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('borrow');
  const { showSnackbarAlert } = useSnackbarAlerts();

  const acceptMutation = useAcceptBorrowRequest();
  const declineMutation = useDeclineBorrowRequest();
  const cancelMutation = useCancelBorrowRequest();
  const markReturnedMutation = useMarkReturned();

  const themed = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.customColors.surfaceContainer,
          borderTopColor: theme.colors.outlineVariant,
        },
      }),
    [theme],
  );

  const actions = getRequestActions(request, currentUserId, request.itemOwnerId, {
    status: request.itemStatus,
    ownerId: request.itemOwnerId,
  });

  if (actions.length === 0) {
    return null;
  }

  const isOwner = request.itemOwnerId === currentUserId;
  const isAnyPending =
    acceptMutation.isPending ||
    declineMutation.isPending ||
    cancelMutation.isPending ||
    markReturnedMutation.isPending;

  const contextKey = getContextKey(request.status, isOwner);
  const requesterName = request.requesterName ?? '';

  const handleAccept = () => {
    acceptMutation.mutate(
      { requestId: request.id, itemId: request.itemId },
      {
        onError: () => {
          showSnackbarAlert({
            message: t('error.acceptFailed'),
            variant: 'error',
            duration: 'long',
          });
        },
      },
    );
  };

  const handleDecline = () => {
    declineMutation.mutate(
      { requestId: request.id, itemId: request.itemId },
      {
        onError: () => {
          showSnackbarAlert({
            message: t('error.declineFailed'),
            variant: 'error',
            duration: 'long',
          });
        },
      },
    );
  };

  const handleCancel = () => {
    cancelMutation.mutate(
      { requestId: request.id, itemId: request.itemId },
      {
        onError: () => {
          showSnackbarAlert({
            message: t('error.cancelFailed'),
            variant: 'error',
            duration: 'long',
          });
        },
      },
    );
  };

  const handleMarkReturned = () => {
    markReturnedMutation.mutate(
      { requestId: request.id, itemId: request.itemId },
      {
        onError: () => {
          showSnackbarAlert({
            message: t('error.markReturnedFailed'),
            variant: 'error',
            duration: 'long',
          });
        },
      },
    );
  };

  return (
    <View style={[styles.container, themed.container]}>
      {contextKey ? (
        <Text variant="bodySmall" style={styles.contextLine}>
          {t(contextKey, { name: requesterName })}
        </Text>
      ) : null}

      <View style={styles.buttonRow}>
        {actions.includes('accept') && (
          <GradientButton
            onPress={handleAccept}
            disabled={isAnyPending}
            testID="actions-banner-accept"
          >
            {t('actions.accept')}
          </GradientButton>
        )}
        {actions.includes('decline') && (
          <Button
            mode="outlined"
            compact
            onPress={handleDecline}
            disabled={isAnyPending}
            testID="actions-banner-decline"
          >
            {t('actions.decline')}
          </Button>
        )}
        {actions.includes('cancel') && (
          <Button
            mode="outlined"
            compact
            onPress={handleCancel}
            disabled={isAnyPending}
            testID="actions-banner-cancel"
          >
            {t('actions.cancel')}
          </Button>
        )}
        {actions.includes('markReturned') && (
          <GradientButton
            onPress={handleMarkReturned}
            disabled={isAnyPending}
            testID="actions-banner-mark-returned"
          >
            {t('actions.markReturned')}
          </GradientButton>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.base,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  contextLine: {
    // color is inherited from theme via Paper Text
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
