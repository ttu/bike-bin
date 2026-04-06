import React from 'react';
import { renderWithProviders } from '@/test/utils';
import MessagesListingDetailScreen from '../[itemId]';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({
    itemId: 'item-abc',
    returnPath: '/(tabs)/messages/msg-1',
  }),
}));

const listingDetailProps: { current?: Record<string, unknown> } = {};

jest.mock('@/features/search/components/ListingDetailRoute', () => ({
  ListingDetailRoute: (props: Record<string, unknown>) => {
    listingDetailProps.current = props;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text: RNText } = require('react-native');
    return <RNText testID="listing-detail-route">ok</RNText>;
  },
}));

describe('MessagesListingDetailScreen', () => {
  beforeEach(() => {
    listingDetailProps.current = undefined;
  });

  it('passes route params to ListingDetailRoute', () => {
    const { getByTestId } = renderWithProviders(<MessagesListingDetailScreen />);
    expect(getByTestId('listing-detail-route')).toBeTruthy();
    expect(listingDetailProps.current).toEqual(
      expect.objectContaining({
        listingId: 'item-abc',
        returnPath: '/(tabs)/messages/msg-1',
        fallbackHref: '/(tabs)/messages',
        thisListingPathPrefix: '/(tabs)/messages/item',
      }),
    );
  });
});
