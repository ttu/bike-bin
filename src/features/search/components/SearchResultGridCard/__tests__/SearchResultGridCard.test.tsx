import { renderWithProviders } from '@/test/utils';
import { createMockSearchResultItem } from '@/test/factories';
import { fireEvent } from '@testing-library/react-native';
import { SearchResultGridCard } from '../SearchResultGridCard';
import type { SearchResultItem } from '../../../types';
import type { LocationId, UserId } from '@/shared/types';
import { AvailabilityType } from '@/shared/types';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.com/${path}` } }),
      }),
    },
  },
}));

jest.mock('@/shared/utils', () => ({
  formatDistance: (meters: number | undefined) =>
    meters === undefined ? undefined : `${(meters / 1000).toFixed(1)} km`,
}));

function gridItem(overrides?: Partial<SearchResultItem>): SearchResultItem {
  return createMockSearchResultItem({
    name: 'Shimano 105 Cassette',
    description: 'Barely used cassette',
    ownerId: 'user-1' as UserId,
    availabilityTypes: [AvailabilityType.Sellable],
    price: 45,
    pickupLocationId: 'loc-1' as LocationId,
    updatedAt: '2026-01-02T00:00:00Z',
    distanceMeters: 2500,
    ownerDisplayName: 'BikeGuy',
    areaName: 'Hackney',
    ...overrides,
  });
}

describe('SearchResultGridCard', () => {
  it('renders item name', () => {
    const item = gridItem();
    const { getByText } = renderWithProviders(<SearchResultGridCard item={item} />);
    expect(getByText('Shimano 105 Cassette')).toBeTruthy();
  });

  it('renders condition', () => {
    const item = gridItem();
    const { getByText } = renderWithProviders(<SearchResultGridCard item={item} />);
    expect(getByText('Good')).toBeTruthy();
  });

  it('renders distance and area name', () => {
    const item = gridItem({ distanceMeters: 2500, areaName: 'Hackney' });
    const { getByText } = renderWithProviders(<SearchResultGridCard item={item} />);
    expect(getByText(/Hackney/)).toBeTruthy();
    expect(getByText(/2\.5 km/)).toBeTruthy();
  });

  it('calls onPress with item when pressed', () => {
    const onPress = jest.fn();
    const item = gridItem();
    const { getByLabelText } = renderWithProviders(
      <SearchResultGridCard item={item} onPress={onPress} />,
    );
    fireEvent.press(getByLabelText('Shimano 105 Cassette'));
    expect(onPress).toHaveBeenCalledWith(item);
  });

  it('renders fallback icon when no thumbnail', () => {
    const item = gridItem({ thumbnailStoragePath: undefined });
    const { getByText } = renderWithProviders(<SearchResultGridCard item={item} />);
    expect(getByText('Shimano 105 Cassette')).toBeTruthy();
  });

  it('renders thumbnail image when available', () => {
    const item = gridItem({ thumbnailStoragePath: 'items/thumb.jpg' });
    const { toJSON } = renderWithProviders(<SearchResultGridCard item={item} />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('https://example.com/items/thumb.jpg');
  });
});
