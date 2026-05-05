import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Href } from 'expo-router';
import { useReturnNavigation } from '@/shared/hooks/useReturnNavigation';
import type { AppTheme } from '@/shared/theme';
import { ConfirmDialog, LoadingScreen, ReportDialog } from '@/shared/components';
import { useAuth } from '@/features/auth';
import { ListingDetail } from '@/features/search/components/ListingDetail/ListingDetail';
import { useListingDetail } from '@/features/search/hooks/useListingDetail';
import { useListingDetailActions } from '@/features/search/hooks/useListingDetailActions';
import type { ItemId, ItemPhoto } from '@/shared/types';
import type { SearchResultItem } from '../../types';

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
  const handleBack = useReturnNavigation(returnPath, fallbackHref);
  const { item, photos, isLoading } = useListingDetail(listingId);

  if (isLoading || !item) {
    return <LoadingScreen />;
  }

  return (
    <LoadedListingDetailRoute
      item={item}
      photos={photos}
      thisListingPath={`${thisListingPathPrefix}/${item.id}`}
      handleBack={handleBack}
    />
  );
}

interface LoadedListingDetailRouteProps {
  readonly item: SearchResultItem;
  readonly photos: ItemPhoto[];
  readonly thisListingPath: string;
  readonly handleBack: () => void;
}

function LoadedListingDetailRoute({
  item,
  photos,
  thisListingPath,
  handleBack,
}: LoadedListingDetailRouteProps) {
  const theme = useTheme<AppTheme>();
  const { user } = useAuth();
  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: { backgroundColor: theme.colors.background },
        header: { backgroundColor: theme.colors.surface },
      }),
    [theme],
  );

  const {
    isOwnItem,
    handleContact,
    handleOwnerPress,
    handleRequestBorrow,
    handlePhotoLongPress,
    handleReportSubmit,
    confirmDialogProps,
    reportPhotoId,
    dismissReport,
    isReportPending,
  } = useListingDetailActions({ item, thisListingPath });

  return (
    <SafeAreaView style={[styles.screen, themedStyles.screen]}>
      <Appbar.Header dark={theme.dark} style={themedStyles.header}>
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
        onDismiss={dismissReport}
        onSubmit={handleReportSubmit}
        loading={isReportPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
