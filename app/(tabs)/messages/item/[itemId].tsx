import { useLocalSearchParams } from 'expo-router';
import { ListingDetailRoute } from '@/features/search/components/ListingDetailRoute';

/**
 * Listing opened from a conversation — lives on the messages stack so the search tab
 * stack stays independent (search home + results are preserved when switching tabs).
 */
export default function MessagesListingDetailScreen() {
  const { itemId, returnPath } = useLocalSearchParams<{
    itemId: string;
    returnPath?: string;
  }>();

  return (
    <ListingDetailRoute
      listingId={itemId}
      returnPath={returnPath}
      fallbackHref="/(tabs)/messages"
      thisListingPathPrefix="/(tabs)/messages/item"
    />
  );
}
