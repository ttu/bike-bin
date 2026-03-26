import { renderWithProviders } from '@/test/utils';
import { fireEvent } from '@testing-library/react-native';
import { SearchResultGridCard } from '../SearchResultGridCard';
import type { SearchResultItem } from '../../../types';
import type { ItemId, UserId, LocationId } from '@/shared/types';
import { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';

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
    meters !== undefined ? `${(meters / 1000).toFixed(1)} km` : undefined,
}));

function createSearchItem(overrides?: Partial<SearchResultItem>): SearchResultItem {
  return {
    id: 'item-1' as ItemId,
    ownerId: 'user-1' as UserId,
    name: 'Shimano 105 Cassette',
    category: ItemCategory.Component,
    brand: 'Shimano',
    model: '105 R7000',
    description: 'Barely used cassette',
    condition: ItemCondition.Good,
    availabilityTypes: [AvailabilityType.Sellable],
    price: 45,
    deposit: undefined,
    borrowDuration: undefined,
    visibility: 'all',
    pickupLocationId: 'loc-1' as LocationId,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    distanceMeters: 2500,
    ownerDisplayName: 'BikeGuy',
    ownerAvatarUrl: undefined,
    ownerRatingAvg: 4.5,
    ownerRatingCount: 12,
    areaName: 'Hackney',
    thumbnailStoragePath: undefined,
    ...overrides,
  };
}

describe('SearchResultGridCard', () => {
  it('renders item name', () => {
    const item = createSearchItem();
    const { getByText } = renderWithProviders(<SearchResultGridCard item={item} />);
    expect(getByText('Shimano 105 Cassette')).toBeTruthy();
  });

  it('renders condition', () => {
    const item = createSearchItem();
    const { getByText } = renderWithProviders(<SearchResultGridCard item={item} />);
    expect(getByText('Good')).toBeTruthy();
  });

  it('renders distance and area name', () => {
    const item = createSearchItem({ distanceMeters: 2500, areaName: 'Hackney' });
    const { getByText } = renderWithProviders(<SearchResultGridCard item={item} />);
    expect(getByText(/Hackney/)).toBeTruthy();
    expect(getByText(/2\.5 km/)).toBeTruthy();
  });

  it('calls onPress with item when pressed', () => {
    const onPress = jest.fn();
    const item = createSearchItem();
    const { getByLabelText } = renderWithProviders(
      <SearchResultGridCard item={item} onPress={onPress} />,
    );
    fireEvent.press(getByLabelText('Shimano 105 Cassette'));
    expect(onPress).toHaveBeenCalledWith(item);
  });

  it('renders fallback icon when no thumbnail', () => {
    const item = createSearchItem({ thumbnailStoragePath: undefined });
    const { getByText } = renderWithProviders(<SearchResultGridCard item={item} />);
    expect(getByText('Shimano 105 Cassette')).toBeTruthy();
  });

  it('renders thumbnail image when available', () => {
    const item = createSearchItem({ thumbnailStoragePath: 'items/thumb.jpg' });
    const { toJSON } = renderWithProviders(<SearchResultGridCard item={item} />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('https://example.com/items/thumb.jpg');
  });
});
