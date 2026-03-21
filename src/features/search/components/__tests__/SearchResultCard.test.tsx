import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import type { ItemId, UserId } from '@/shared/types';
import { SearchResultCard } from '../SearchResultCard/SearchResultCard';
import type { SearchResultItem } from '../../types';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: {
            publicUrl: `https://test.supabase.co/storage/v1/object/public/item-photos/${path}`,
          },
        }),
      }),
    },
  },
}));

function createSearchResult(overrides?: Partial<SearchResultItem>): SearchResultItem {
  return {
    id: 'item-1' as ItemId,
    ownerId: 'owner-1' as UserId,
    name: 'Shimano Cassette',
    category: ItemCategory.Component,
    brand: 'Shimano',
    model: '105 R7000',
    description: 'Good cassette for road bikes',
    condition: ItemCondition.Good,
    availabilityTypes: [AvailabilityType.Borrowable],
    price: undefined,
    deposit: undefined,
    borrowDuration: undefined,
    visibility: 'all',
    pickupLocationId: undefined,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    distanceMeters: 1500,
    ownerDisplayName: 'Alice',
    ownerAvatarUrl: undefined,
    ownerRatingAvg: 4.5,
    ownerRatingCount: 12,
    areaName: 'Berlin Mitte',
    thumbnailStoragePath: undefined,
    ...overrides,
  };
}

describe('SearchResultCard', () => {
  it('renders item name', () => {
    const item = createSearchResult();
    const { getByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(getByText('Shimano Cassette')).toBeTruthy();
  });

  it('renders condition text', () => {
    const item = createSearchResult();
    const { getByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(getByText('Good')).toBeTruthy();
  });

  it('renders owner display name', () => {
    const item = createSearchResult({ ownerDisplayName: 'Alice' });
    const { getByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(getByText('Alice')).toBeTruthy();
  });

  it('renders availability chips', () => {
    const item = createSearchResult({
      availabilityTypes: [AvailabilityType.Borrowable, AvailabilityType.Sellable],
      price: 25,
    });
    const { getByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(getByText('Borrowable')).toBeTruthy();
    expect(getByText(/Sellable/)).toBeTruthy();
  });

  it('renders area name and distance', () => {
    const item = createSearchResult({ areaName: 'Kreuzberg', distanceMeters: 3200 });
    const { getByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(getByText(/Kreuzberg/)).toBeTruthy();
    expect(getByText(/3.2 km/)).toBeTruthy();
  });

  it('renders distance in meters when under 1km', () => {
    const item = createSearchResult({ distanceMeters: 500 });
    const { getByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(getByText(/500 m/)).toBeTruthy();
  });

  it('fires onPress with item', () => {
    const item = createSearchResult();
    const onPress = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <SearchResultCard item={item} onPress={onPress} />,
    );
    fireEvent.press(getByLabelText('Shimano Cassette'));
    expect(onPress).toHaveBeenCalledWith(item);
  });

  it('shows price for sellable items', () => {
    const item = createSearchResult({
      availabilityTypes: [AvailabilityType.Sellable],
      price: 42.5,
    });
    const { getByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(getByText(/42.5/)).toBeTruthy();
  });

  it('renders without owner name when undefined', () => {
    const item = createSearchResult({ ownerDisplayName: undefined });
    const { queryByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(queryByText('Alice')).toBeNull();
  });
});
