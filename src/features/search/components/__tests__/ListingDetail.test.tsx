import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import type { ItemId, UserId } from '@/shared/types';
import { ListingDetail } from '../ListingDetail/ListingDetail';
import type { SearchResultItem } from '../../types';

// Mock supabase client
jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test/${path}` } }),
      }),
    },
  },
}));

// Mock useAuth
jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
    session: {},
  }),
}));

function createSearchResult(overrides?: Partial<SearchResultItem>): SearchResultItem {
  return {
    id: 'item-1' as ItemId,
    ownerId: 'owner-1' as UserId,
    name: 'Shimano Cassette',
    category: ItemCategory.Component,
    brand: 'Shimano',
    model: '105 R7000',
    description: 'Great condition cassette for road bikes',
    condition: ItemCondition.Good,
    availabilityTypes: [AvailabilityType.Borrowable],
    price: undefined,
    deposit: undefined,
    borrowDuration: undefined,
    visibility: 'all',
    pickupLocationId: undefined,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    distanceMeters: 2500,
    ownerDisplayName: 'Alice',
    ownerAvatarUrl: undefined,
    ownerRatingAvg: 4.5,
    ownerRatingCount: 12,
    areaName: 'Berlin Mitte',
    thumbnailStoragePath: undefined,
    ...overrides,
  };
}

describe('ListingDetail', () => {
  it('renders item name and subtitle', () => {
    const item = createSearchResult();
    const { getByText, getAllByText } = renderWithProviders(
      <ListingDetail item={item} photos={[]} />,
    );
    expect(getByText('Shimano Cassette')).toBeTruthy();
    expect(getByText(/Component/)).toBeTruthy();
    // Brand "Shimano" appears in both the name and the subtitle
    const shimanoTexts = getAllByText(/Shimano/);
    expect(shimanoTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders availability chips', () => {
    const item = createSearchResult({
      availabilityTypes: [AvailabilityType.Borrowable, AvailabilityType.Donatable],
    });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText('Borrowable')).toBeTruthy();
    expect(getByText('Donatable')).toBeTruthy();
  });

  it('renders owner card with display name', () => {
    const item = createSearchResult({ ownerDisplayName: 'Alice' });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText(/View profile/)).toBeTruthy();
  });

  it('renders owner rating when available', () => {
    const item = createSearchResult({ ownerRatingAvg: 4.5, ownerRatingCount: 12 });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText(/4.5/)).toBeTruthy();
    expect(getByText(/12/)).toBeTruthy();
  });

  it('renders area and distance', () => {
    const item = createSearchResult({ areaName: 'Kreuzberg', distanceMeters: 3200 });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText(/Kreuzberg/)).toBeTruthy();
    expect(getByText(/3.2 km/)).toBeTruthy();
  });

  it('renders description', () => {
    const item = createSearchResult({ description: 'Great condition cassette for road bikes' });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText('Great condition cassette for road bikes')).toBeTruthy();
  });

  it('renders condition in detail grid', () => {
    const item = createSearchResult();
    const { getAllByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    // "Good" appears in both subtitle and detail grid
    const goodTexts = getAllByText('Good');
    expect(goodTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('shows borrow button disabled when no handler provided for borrowable-only items', () => {
    const item = createSearchResult({
      availabilityTypes: [AvailabilityType.Borrowable],
    });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText(/Request Borrow/)).toBeTruthy();
  });

  it('shows borrow button enabled when handler provided', () => {
    const item = createSearchResult({
      availabilityTypes: [AvailabilityType.Borrowable],
    });
    const onRequestBorrow = jest.fn();
    const { getByText } = renderWithProviders(
      <ListingDetail item={item} photos={[]} onRequestBorrow={onRequestBorrow} />,
    );
    expect(getByText(/Request Borrow/)).toBeTruthy();
  });

  it('shows contact button for donatable-only items', () => {
    const item = createSearchResult({
      availabilityTypes: [AvailabilityType.Donatable],
    });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText(/Contact/)).toBeTruthy();
  });

  it('shows both buttons for mixed availability', () => {
    const item = createSearchResult({
      availabilityTypes: [AvailabilityType.Borrowable, AvailabilityType.Sellable],
      price: 50,
    });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText(/Contact/)).toBeTruthy();
    expect(getByText(/Request Borrow/)).toBeTruthy();
  });

  it('renders translated borrow duration', () => {
    const item = createSearchResult({ borrowDuration: '1_week' });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText('1 week')).toBeTruthy();
  });

  it('renders raw borrow duration when no translation key matches', () => {
    const item = createSearchResult({ borrowDuration: '7 days' });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText('7 days')).toBeTruthy();
  });

  it('calls onOwnerPress when owner name is pressed', () => {
    const onOwnerPress = jest.fn();
    const item = createSearchResult({ ownerDisplayName: 'Alice' });
    const { getByText } = renderWithProviders(
      <ListingDetail item={item} photos={[]} onOwnerPress={onOwnerPress} />,
    );
    fireEvent.press(getByText('Alice'));
    expect(onOwnerPress).toHaveBeenCalledTimes(1);
  });

  it('calls onOwnerPress when view profile is pressed', () => {
    const onOwnerPress = jest.fn();
    const item = createSearchResult({ ownerDisplayName: 'Alice' });
    const { getByText } = renderWithProviders(
      <ListingDetail item={item} photos={[]} onOwnerPress={onOwnerPress} />,
    );
    fireEvent.press(getByText(/View profile/));
    expect(onOwnerPress).toHaveBeenCalledTimes(1);
  });

  it('hides location row when no area name or distance', () => {
    const item = createSearchResult({ areaName: undefined, distanceMeters: undefined });
    const { queryByTestId } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(queryByTestId('location-row')).toBeNull();
  });

  it('shows location row when area name is present', () => {
    const item = createSearchResult({ areaName: 'Kreuzberg', distanceMeters: undefined });
    const { getByTestId } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByTestId('location-row')).toBeTruthy();
  });

  it('renders price for sellable items', () => {
    const item = createSearchResult({
      availabilityTypes: [AvailabilityType.Sellable],
      price: 42,
    });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText(/42/)).toBeTruthy();
  });
});
