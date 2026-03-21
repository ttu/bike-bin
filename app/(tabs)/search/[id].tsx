import { StyleSheet, Alert } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase';
import type { AppTheme } from '@/shared/theme';
import type { ItemId, UserId, LocationId } from '@/shared/types';
import type { ItemCategory, ItemCondition, AvailabilityType, ItemPhoto } from '@/shared/types';
import { LoadingScreen } from '@/shared/components';
import { ListingDetail } from '@/features/search';
import type { SearchResultItem } from '@/features/search';
import { useCreateConversation } from '@/features/messaging';
import { useCreateBorrowRequest } from '@/features/borrow';

export default function ListingDetailScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('search');
  const { t: tBorrow } = useTranslation('borrow');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { mutate: createConversation } = useCreateConversation();
  const { mutate: createBorrowRequest } = useCreateBorrowRequest();

  // Fetch item by ID
  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async (): Promise<SearchResultItem> => {
      const { data, error } = await supabase.from('items').select('*').eq('id', id!).single();

      if (error) throw error;

      // Fetch owner profile
      const { data: owner } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, rating_avg, rating_count')
        .eq('id', data.owner_id)
        .single();

      // Fetch location area name
      let areaName: string | undefined;
      if (data.pickup_location_id) {
        const { data: loc } = await supabase
          .from('saved_locations')
          .select('area_name')
          .eq('id', data.pickup_location_id)
          .single();
        areaName = (loc?.area_name as string) ?? undefined;
      }

      return {
        id: data.id as ItemId,
        ownerId: data.owner_id as UserId,
        name: data.name as string,
        category: data.category as ItemCategory,
        brand: (data.brand as string) ?? undefined,
        model: (data.model as string) ?? undefined,
        description: (data.description as string) ?? undefined,
        condition: data.condition as ItemCondition,
        availabilityTypes: (data.availability_types ?? []) as AvailabilityType[],
        price: (data.price as number) ?? undefined,
        deposit: (data.deposit as number) ?? undefined,
        borrowDuration: (data.borrow_duration as string) ?? undefined,
        visibility: data.visibility as string,
        pickupLocationId: (data.pickup_location_id as LocationId) ?? undefined,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
        distanceMeters: undefined,
        ownerDisplayName: (owner?.display_name as string) ?? undefined,
        ownerAvatarUrl: (owner?.avatar_url as string) ?? undefined,
        ownerRatingAvg: (owner?.rating_avg as number) ?? 0,
        ownerRatingCount: (owner?.rating_count as number) ?? 0,
        areaName,
        thumbnailStoragePath: undefined,
      };
    },
    enabled: !!id,
  });

  // Fetch photos
  const { data: photos } = useQuery({
    queryKey: ['item_photos', id],
    queryFn: async (): Promise<ItemPhoto[]> => {
      const { data, error } = await supabase
        .from('item_photos')
        .select('*')
        .eq('item_id', id!)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as ItemPhoto[];
    },
    enabled: !!id,
  });

  if (itemLoading || !item) {
    return <LoadingScreen />;
  }

  const handleContact = () => {
    createConversation(
      { itemId: item.id, otherUserId: item.ownerId },
      {
        onSuccess: (result) => {
          router.push(`/messages/${result.conversationId}`);
        },
      },
    );
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
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="" />
        <Appbar.Action
          icon="flag-outline"
          onPress={() => {}}
          accessibilityLabel={t('listing.report')}
        />
      </Appbar.Header>

      <ListingDetail
        item={item}
        photos={photos ?? []}
        onContact={handleContact}
        onRequestBorrow={handleRequestBorrow}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
