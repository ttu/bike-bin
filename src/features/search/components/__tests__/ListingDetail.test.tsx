import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockSearchResultItem } from '@/test/factories';
import { AvailabilityType, type ItemId, type ItemPhoto, type ItemPhotoId } from '@/shared/types';
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

// Mock useAuth (mutable so individual tests can flip auth state)
let mockAuthenticated = true;
jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: mockAuthenticated ? { id: 'user-123' } : undefined,
    isAuthenticated: mockAuthenticated,
    session: mockAuthenticated ? {} : undefined,
  }),
}));

function listingItem(overrides?: Partial<SearchResultItem>): SearchResultItem {
  return createMockSearchResultItem({
    description: 'Great condition cassette for road bikes',
    distanceMeters: 2500,
    ...overrides,
  });
}

describe('ListingDetail', () => {
  it('renders item name and subtitle', () => {
    const item = listingItem();
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
    const item = listingItem({
      availabilityTypes: [AvailabilityType.Borrowable, AvailabilityType.Donatable],
    });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText('Borrow')).toBeTruthy();
    expect(getByText('Donate')).toBeTruthy();
  });

  it('renders owner card with display name', () => {
    const item = listingItem({ ownerDisplayName: 'Alice' });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText(/View profile/)).toBeTruthy();
  });

  it('renders owner rating when available', () => {
    const item = listingItem({ ownerRatingAvg: 4.5, ownerRatingCount: 12 });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText(/4.5/)).toBeTruthy();
    expect(getByText(/12/)).toBeTruthy();
  });

  it('renders area and distance', () => {
    const item = listingItem({ areaName: 'Kreuzberg', distanceMeters: 3200 });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText(/Kreuzberg/)).toBeTruthy();
    expect(getByText(/3.2 km/)).toBeTruthy();
  });

  it('renders description', () => {
    const item = listingItem({ description: 'Great condition cassette for road bikes' });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText('Great condition cassette for road bikes')).toBeTruthy();
  });

  it('renders condition in detail grid', () => {
    const item = listingItem();
    const { getAllByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    // "Good" appears in both subtitle and detail grid
    const goodTexts = getAllByText('Good');
    expect(goodTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('hides borrow button when no handler provided for borrowable-only items', () => {
    const item = listingItem({
      availabilityTypes: [AvailabilityType.Borrowable],
    });
    const { queryByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(queryByText(/Request Borrow/)).toBeNull();
  });

  it('shows borrow button enabled when handler provided', () => {
    const item = listingItem({
      availabilityTypes: [AvailabilityType.Borrowable],
    });
    const onRequestBorrow = jest.fn();
    const { getByText } = renderWithProviders(
      <ListingDetail item={item} photos={[]} onRequestBorrow={onRequestBorrow} />,
    );
    expect(getByText(/Request Borrow/)).toBeTruthy();
  });

  it('shows contact button for donatable-only items when handler provided', () => {
    const item = listingItem({
      availabilityTypes: [AvailabilityType.Donatable],
    });
    const { getByText } = renderWithProviders(
      <ListingDetail item={item} photos={[]} onContact={jest.fn()} />,
    );
    expect(getByText(/Contact/)).toBeTruthy();
  });

  it('shows both buttons for mixed availability when handlers provided', () => {
    const item = listingItem({
      availabilityTypes: [AvailabilityType.Borrowable, AvailabilityType.Sellable],
      price: 50,
    });
    const { getByText } = renderWithProviders(
      <ListingDetail item={item} photos={[]} onContact={jest.fn()} onRequestBorrow={jest.fn()} />,
    );
    expect(getByText(/Contact/)).toBeTruthy();
    expect(getByText(/Request Borrow/)).toBeTruthy();
  });

  it('hides contact button on own listing (no onContact handler)', () => {
    const item = listingItem({
      availabilityTypes: [AvailabilityType.Donatable],
    });
    const { queryByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(queryByText(/Contact/)).toBeNull();
  });

  it('renders translated borrow duration', () => {
    const item = listingItem({ borrowDuration: '1_week' });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText('1 week')).toBeTruthy();
  });

  it('renders raw borrow duration when no translation key matches', () => {
    const item = listingItem({ borrowDuration: '7 days' });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText('7 days')).toBeTruthy();
  });

  it('calls onOwnerPress when owner name is pressed', () => {
    const onOwnerPress = jest.fn();
    const item = listingItem({ ownerDisplayName: 'Alice' });
    const { getByText } = renderWithProviders(
      <ListingDetail item={item} photos={[]} onOwnerPress={onOwnerPress} />,
    );
    fireEvent.press(getByText('Alice'));
    expect(onOwnerPress).toHaveBeenCalledTimes(1);
  });

  it('calls onOwnerPress when view profile is pressed', () => {
    const onOwnerPress = jest.fn();
    const item = listingItem({ ownerDisplayName: 'Alice' });
    const { getByText } = renderWithProviders(
      <ListingDetail item={item} photos={[]} onOwnerPress={onOwnerPress} />,
    );
    fireEvent.press(getByText(/View profile/));
    expect(onOwnerPress).toHaveBeenCalledTimes(1);
  });

  it('hides location row when no area name or distance', () => {
    const item = listingItem({ areaName: undefined, distanceMeters: undefined });
    const { queryByTestId } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(queryByTestId('location-row')).toBeNull();
  });

  it('shows location row when area name is present', () => {
    const item = listingItem({ areaName: 'Kreuzberg', distanceMeters: undefined });
    const { getByTestId } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByTestId('location-row')).toBeTruthy();
  });

  it('renders price for sellable items', () => {
    const item = listingItem({
      availabilityTypes: [AvailabilityType.Sellable],
      price: 42,
    });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    expect(getByText(/42/)).toBeTruthy();
  });

  it('renders Avatar.Image when ownerAvatarUrl is provided', () => {
    const item = listingItem({ ownerAvatarUrl: 'https://example.com/avatar.jpg' });
    const { getByTestId, queryByTestId } = renderWithProviders(
      <ListingDetail item={item} photos={[]} />,
    );
    expect(getByTestId('owner-avatar-image')).toBeTruthy();
    expect(queryByTestId('owner-avatar-icon')).toBeNull();
  });

  it('renders Avatar.Icon when ownerAvatarUrl is not provided', () => {
    const item = listingItem({ ownerAvatarUrl: undefined });
    const { getByTestId, queryByTestId } = renderWithProviders(
      <ListingDetail item={item} photos={[]} />,
    );
    expect(getByTestId('owner-avatar-icon')).toBeTruthy();
    expect(queryByTestId('owner-avatar-image')).toBeNull();
  });

  it('calls onPhotoLongPress with the matched ItemPhoto on long-press', () => {
    const onPhotoLongPress = jest.fn();
    const photos: ItemPhoto[] = [
      {
        id: 'p1' as ItemPhotoId,
        itemId: 'item-1' as ItemId,
        storagePath: 'items/photo1.jpg',
        sortOrder: 0,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    const item = listingItem();
    const { getByLabelText } = renderWithProviders(
      <ListingDetail item={item} photos={photos} onPhotoLongPress={onPhotoLongPress} />,
    );
    fireEvent(getByLabelText('Photo 1'), 'longPress');
    expect(onPhotoLongPress).toHaveBeenCalledWith(photos[0]);
  });

  it('formats price via Intl currency formatter for sellable items', () => {
    const item = listingItem({
      availabilityTypes: [AvailabilityType.Sellable],
      price: 42,
    });
    const { getByText } = renderWithProviders(<ListingDetail item={item} photos={[]} />);
    // Intl.NumberFormat style:'currency', currency:'EUR' emits the EUR indicator
    // (`€` or `EUR` depending on locale/ICU) next to the amount.
    expect(getByText(/(?:€|EUR)\s?42|42\s?(?:€|EUR)/)).toBeTruthy();
  });

  it('renders disabled sign-in prompt when unauthenticated', () => {
    mockAuthenticated = false;
    try {
      const item = listingItem({ availabilityTypes: [AvailabilityType.Borrowable] });
      const { getByText, queryByText } = renderWithProviders(
        <ListingDetail item={item} photos={[]} />,
      );
      expect(getByText(/Sign in to contact/)).toBeTruthy();
      expect(queryByText(/Request Borrow/)).toBeNull();
      expect(queryByText(/^Contact$/)).toBeNull();
    } finally {
      mockAuthenticated = true;
    }
  });
});
