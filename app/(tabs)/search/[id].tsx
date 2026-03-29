import { StyleSheet, Alert } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  decodeReturnPathParam,
  encodeReturnPath,
  isSafeTabReturnPath,
} from '@/shared/utils/returnPath';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import type { AppTheme } from '@/shared/theme';
import { LoadingScreen } from '@/shared/components';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { ListingDetail, useListingDetail } from '@/features/search';
import { useCreateConversation } from '@/features/messaging';
import { useCreateBorrowRequest } from '@/features/borrow';
import { useAuth } from '@/features/auth';

export default function ListingDetailScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('search');
  const { t: tBorrow } = useTranslation('borrow');
  const router = useRouter();
  const { id, returnPath } = useLocalSearchParams<{ id: string; returnPath?: string }>();
  const { mutate: createConversation } = useCreateConversation();
  const { mutate: createBorrowRequest } = useCreateBorrowRequest();
  const { user } = useAuth();
  const { showSnackbarAlert } = useSnackbarAlerts();

  const { item, photos, isLoading } = useListingDetail(id);

  const isOwnItem = item?.ownerId === user?.id;

  if (isLoading || !item) {
    return <LoadingScreen />;
  }

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
        returnPath: encodeReturnPath(`/(tabs)/search/${item.id}`),
      },
    });
  };

  const handleBack = () => {
    const decoded = decodeReturnPathParam(returnPath);
    if (decoded && isSafeTabReturnPath(decoded)) {
      router.replace(decoded as Href);
      return;
    }
    tabScopedBack('/(tabs)/search');
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
                  router.push('/(tabs)/profile/borrow-requests' as never);
                },
              },
            );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={handleBack} />
        <Appbar.Content title="" />
        <Appbar.Action
          icon="flag-outline"
          onPress={() => {}}
          accessibilityLabel={t('listing.report')}
        />
      </Appbar.Header>

      <ListingDetail
        item={item}
        photos={photos}
        onContact={isOwnItem ? undefined : handleContact}
        onRequestBorrow={isOwnItem ? undefined : handleRequestBorrow}
        onOwnerPress={handleOwnerPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
