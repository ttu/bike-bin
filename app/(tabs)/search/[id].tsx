import { useLocalSearchParams } from 'expo-router';
import { ListingDetailRoute } from '@/features/search/components/ListingDetailRoute';
import type { ItemId } from '@/shared/types';

export default function SearchListingDetailScreen() {
  const { id, returnPath } = useLocalSearchParams<{ id: string; returnPath?: string }>();

  return (
    <ListingDetailRoute
      listingId={id as ItemId | undefined}
      returnPath={returnPath}
      fallbackHref="/(tabs)/search"
      thisListingPathPrefix="/(tabs)/search"
    />
  );
}
