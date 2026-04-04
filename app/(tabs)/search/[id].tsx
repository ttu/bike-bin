import { useLocalSearchParams } from 'expo-router';
import { ListingDetailRoute } from '@/features/search/components/ListingDetailRoute';

export default function SearchListingDetailScreen() {
  const { id, returnPath } = useLocalSearchParams<{ id: string; returnPath?: string }>();

  return (
    <ListingDetailRoute
      listingId={id}
      returnPath={returnPath}
      fallbackHref="/(tabs)/search"
      thisListingPathPrefix="/(tabs)/search"
    />
  );
}
