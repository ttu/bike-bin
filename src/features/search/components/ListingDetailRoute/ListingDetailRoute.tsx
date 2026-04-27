import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { encodeReturnPath } from '@/shared/utils/returnPath';
import { useReturnNavigation } from '@/shared/hooks/useReturnNavigation';
import type { AppTheme } from '@/shared/theme';
import { ConfirmDialog, LoadingScreen, ReportDialog, type ReportReason } from '@/shared/components';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { ListingDetail } from '@/features/search/components/ListingDetail/ListingDetail';
import { useListingDetail } from '@/features/search/hooks/useListingDetail';
import { useCreateConversation } from '@/features/messaging';
import { useCreateBorrowRequest } from '@/features/borrow';
import { useAuth } from '@/features/auth';
import { useReport } from '@/shared/hooks/useReport';
import type { ItemId, ItemPhoto, ItemPhotoId, UserId } from '@/shared/types';

export type ListingDetailRouteProps = {
  readonly listingId: ItemId | undefined;
  readonly returnPath: string | undefined;
  /** Used when `returnPath` is absent or invalid */
  readonly fallbackHref: Href;
  /** Prefix for the current listing URL (e.g. `/(tabs)/search` or `/(tabs)/messages/item`) */
  readonly thisListingPathPrefix: Href;
};

export function ListingDetailRoute({
  listingId,
  returnPath,
  fallbackHref,
  thisListingPathPrefix,
}: ListingDetailRouteProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('search');
  const { t: tBorrow } = useTranslation('borrow');
  const { t: tProfile } = useTranslation('profile');
  const router = useRouter();
  const { mutate: createConversation } = useCreateConversation();
  const { mutate: createBorrowRequest } = useCreateBorrowRequest();
  const { user } = useAuth();
  const { showSnackbarAlert } = useSnackbarAlerts();
  const reportMutation = useReport();
  const { openConfirm, closeConfirm, confirmDialogProps } = useConfirmDialog();
  const handleBack = useReturnNavigation(returnPath, fallbackHref);
  const [reportPhotoId, setReportPhotoId] = useState<ItemPhotoId | undefined>(undefined);

  const { item, photos, isLoading } = useListingDetail(listingId);

  const isOwnItem = item?.ownerId === user?.id;

  if (isLoading || !item) {
    return <LoadingScreen />;
  }

  const thisListingPath = `${thisListingPathPrefix}/${item.id}`;

  const resolveContactParams = () => {
    // Group items use the shared-inbox path (all admins as participants);
    // personal items use the direct owner path.
    if (item.groupId !== undefined) return { itemId: item.id, groupId: item.groupId };
    if (item.ownerId !== undefined) return { itemId: item.id, otherUserId: item.ownerId };
    return undefined;
  };

  const handleContact = () => {
    const params = resolveContactParams();
    if (!params) return;
    createConversation(params, {
      onSuccess: (result) => {
        router.push(`/messages/${result.conversationId}`);
      },
      onError: () => {
        showSnackbarAlert({
          message: t('listing.errors.contactFailed'),
          variant: 'error',
          duration: 'long',
        });
      },
    });
  };

  const handleOwnerPress = () => {
    if (!item.ownerId) return;
    router.push({
      pathname: '/(tabs)/profile/[userId]',
      params: {
        userId: item.ownerId,
        returnPath: encodeReturnPath(thisListingPath),
      },
    });
  };

  const handleRequestBorrow = () => {
    openConfirm({
      title: tBorrow('confirm.requestBorrow.title'),
      message: tBorrow('confirm.requestBorrow.message', { itemName: item.name }),
      cancelLabel: tBorrow('confirm.requestBorrow.cancel'),
      confirmLabel: tBorrow('confirm.requestBorrow.confirm'),
      onConfirm: () => {
        // Close the dialog immediately to prevent double-submit from repeated Confirm taps
        // before createBorrowRequest resolves.
        closeConfirm();
        createBorrowRequest(
          { itemId: item.id },
          {
            onSuccess: () => {
              router.push('/(tabs)/profile/borrow-requests');
            },
            onError: () => {
              showSnackbarAlert({
                message: tBorrow('error.requestFailed'),
                variant: 'error',
                duration: 'long',
              });
            },
          },
        );
      },
    });
  };

  const handlePhotoLongPress = (photo: ItemPhoto) => {
    if (isOwnItem) return;
    setReportPhotoId(photo.id);
  };

  const handleReportSubmit = (reason: ReportReason, text: string | undefined) => {
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
            message: tProfile('report.successMessage'),
            variant: 'success',
          });
        },
        onError: () => {
          showSnackbarAlert({
            message: tProfile('report.errorMessage'),
            variant: 'error',
            duration: 'long',
          });
        },
      },
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={handleBack} />
        <Appbar.Content title="" />
      </Appbar.Header>

      <ListingDetail
        item={item}
        photos={photos}
        onContact={isOwnItem ? undefined : handleContact}
        onRequestBorrow={isOwnItem ? undefined : handleRequestBorrow}
        onOwnerPress={item.ownerId ? handleOwnerPress : undefined}
        onPhotoLongPress={isOwnItem || !user ? undefined : handlePhotoLongPress}
      />

      <ConfirmDialog {...confirmDialogProps} />

      <ReportDialog
        visible={reportPhotoId !== undefined}
        onDismiss={() => setReportPhotoId(undefined)}
        onSubmit={handleReportSubmit}
        loading={reportMutation.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
