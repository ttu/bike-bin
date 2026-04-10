import { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  decodeReturnPathParam,
  encodeReturnPath,
  isSafeTabReturnPath,
} from '@/shared/utils/returnPath';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import type { AppTheme } from '@/shared/theme';
import { LoadingScreen, ReportDialog, type ReportReason } from '@/shared/components';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { ListingDetail } from '@/features/search/components/ListingDetail/ListingDetail';
import { useListingDetail } from '@/features/search/hooks/useListingDetail';
import { useCreateConversation } from '@/features/messaging';
import { useCreateBorrowRequest } from '@/features/borrow';
import { useAuth } from '@/features/auth';
import { useReport } from '@/shared/hooks/useReport';
import type { ItemPhoto, ItemPhotoId, UserId } from '@/shared/types';

export type ListingDetailRouteProps = {
  listingId: string | undefined;
  returnPath: string | undefined;
  /** Used when `returnPath` is absent or invalid */
  fallbackHref: Href;
  /** Prefix for the current listing URL (e.g. `/(tabs)/search` or `/(tabs)/messages/item`) */
  thisListingPathPrefix: Href;
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
  const [reportPhotoId, setReportPhotoId] = useState<ItemPhotoId | undefined>(undefined);

  const { item, photos, isLoading } = useListingDetail(listingId);

  const isOwnItem = item?.ownerId === user?.id;

  if (isLoading || !item) {
    return <LoadingScreen />;
  }

  const thisListingPath = `${thisListingPathPrefix}/${item.id}`;

  const handleContact = () => {
    createConversation(
      { itemId: item.id, otherUserId: item.ownerId },
      {
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
      },
    );
  };

  const handleOwnerPress = () => {
    router.push({
      pathname: '/(tabs)/profile/[userId]',
      params: {
        userId: item.ownerId,
        returnPath: encodeReturnPath(thisListingPath),
      },
    });
  };

  const handleBack = () => {
    const decoded = decodeReturnPathParam(returnPath);
    if (decoded && isSafeTabReturnPath(decoded)) {
      router.replace(decoded as Href);
      return;
    }
    tabScopedBack(fallbackHref);
  };

  const handleRequestBorrow = () => {
    Alert.alert(
      tBorrow('confirm.requestBorrow.title'),
      tBorrow('confirm.requestBorrow.message', { itemName: item.name }),
      [
        { text: tBorrow('confirm.requestBorrow.cancel'), style: 'cancel' },
        {
          text: tBorrow('confirm.requestBorrow.confirm'),
          onPress: () => {
            createBorrowRequest(
              { itemId: item.id },
              {
                onSuccess: () => {
                  router.push('/(tabs)/profile/borrow-requests');
                },
              },
            );
          },
        },
      ],
    );
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
        onOwnerPress={handleOwnerPress}
        onPhotoLongPress={isOwnItem || !user ? undefined : handlePhotoLongPress}
      />

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
