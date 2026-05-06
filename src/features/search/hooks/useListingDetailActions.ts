import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth';
import { useCreateBorrowRequest, useRequestBorrowDialogConfig } from '@/features/borrow';
import { useCreateConversation } from '@/features/messaging';
import { useReport } from '@/shared/hooks/useReport';
import { useReportFeedbackMessages } from '@/shared/hooks/useReportFeedbackMessages';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { encodeReturnPath } from '@/shared/utils/returnPath';
import type { ReportReason } from '@/shared/components';
import type { ItemPhoto, ItemPhotoId, UserId } from '@/shared/types';
import type { SearchResultItem } from '../types';

interface UseListingDetailActionsArgs {
  readonly item: SearchResultItem;
  readonly thisListingPath: string;
}

export function useListingDetailActions({ item, thisListingPath }: UseListingDetailActionsArgs) {
  const { t } = useTranslation('search');
  const requestBorrowDialog = useRequestBorrowDialogConfig(item.name);
  const reportFeedback = useReportFeedbackMessages();
  const router = useRouter();
  const { user } = useAuth();
  const { mutate: createConversation } = useCreateConversation();
  const { mutate: createBorrowRequest } = useCreateBorrowRequest();
  const { showSnackbarAlert } = useSnackbarAlerts();
  const reportMutation = useReport();
  const { openConfirm, closeConfirm, confirmDialogProps } = useConfirmDialog();
  const [reportPhotoId, setReportPhotoId] = useState<ItemPhotoId | undefined>(undefined);

  const isOwnItem = item.ownerId === user?.id;

  const handleContact = useCallback(() => {
    // Group items use the shared-inbox path (all admins as participants);
    // personal items use the direct owner path.
    const params =
      item.groupId !== undefined
        ? { itemId: item.id, groupId: item.groupId }
        : item.ownerId !== undefined
          ? { itemId: item.id, otherUserId: item.ownerId }
          : undefined;
    if (!params) return;
    createConversation(params, {
      onSuccess: (result) => router.push(`/messages/${result.conversationId}`),
      onError: () =>
        showSnackbarAlert({
          message: t('listing.errors.contactFailed'),
          variant: 'error',
          duration: 'long',
        }),
    });
  }, [item, createConversation, router, showSnackbarAlert, t]);

  const handleOwnerPress = useCallback(() => {
    if (!item.ownerId) return;
    router.push({
      pathname: '/(tabs)/profile/[userId]',
      params: { userId: item.ownerId, returnPath: encodeReturnPath(thisListingPath) },
    });
  }, [item.ownerId, router, thisListingPath]);

  const handleRequestBorrow = useCallback(() => {
    const { errorMessage, ...dialog } = requestBorrowDialog;
    openConfirm({
      ...dialog,
      onConfirm: () => {
        // Close dialog before mutation resolves to prevent double-submit on repeated taps.
        closeConfirm();
        createBorrowRequest(
          { itemId: item.id },
          {
            onSuccess: () => router.push('/(tabs)/profile/borrow-requests'),
            onError: () =>
              showSnackbarAlert({
                message: errorMessage,
                variant: 'error',
                duration: 'long',
              }),
          },
        );
      },
    });
  }, [
    item.id,
    requestBorrowDialog,
    openConfirm,
    closeConfirm,
    createBorrowRequest,
    router,
    showSnackbarAlert,
  ]);

  const handlePhotoLongPress = useCallback(
    (photo: ItemPhoto) => {
      if (isOwnItem) return;
      setReportPhotoId(photo.id);
    },
    [isOwnItem],
  );

  const handleReportSubmit = useCallback(
    (reason: ReportReason, text: string | undefined) => {
      if (!user || !reportPhotoId) return;
      reportMutation.mutate(
        {
          reporterId: user.id as UserId,
          targetType: 'item_photo',
          targetId: reportPhotoId,
          reason,
          text,
        },
        {
          onSuccess: () => {
            setReportPhotoId(undefined);
            showSnackbarAlert({
              message: reportFeedback.success,
              variant: 'success',
            });
          },
          onError: () =>
            showSnackbarAlert({
              message: reportFeedback.error,
              variant: 'error',
              duration: 'long',
            }),
        },
      );
    },
    [user, reportPhotoId, reportMutation, showSnackbarAlert, reportFeedback],
  );

  const dismissReport = useCallback(() => setReportPhotoId(undefined), []);

  return {
    isOwnItem,
    handleContact,
    handleOwnerPress,
    handleRequestBorrow,
    handlePhotoLongPress,
    handleReportSubmit,
    confirmDialogProps,
    reportPhotoId,
    dismissReport,
    isReportPending: reportMutation.isPending,
  };
}
