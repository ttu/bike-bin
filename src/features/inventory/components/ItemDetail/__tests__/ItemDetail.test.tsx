import { Dimensions } from 'react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import { ItemStatus, ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import { ItemDetail } from '../ItemDetail';

// Mock supabase client (needed by PhotoGallery and useDistanceUnit)
jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test/${path}` } }),
      }),
    },
  },
}));

// Mock auth for useDistanceUnit hook
jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: null, signOut: jest.fn() }),
}));

describe('ItemDetail', () => {
  const baseItem = createMockItem({
    name: 'Shimano Cassette',
    category: ItemCategory.Component,
    condition: ItemCondition.Good,
    status: ItemStatus.Stored,
    brand: 'Shimano',
    model: '105 R7000',
    availabilityTypes: [AvailabilityType.Borrowable, AvailabilityType.Sellable],
    price: 45.0,
    age: '2 years',
    usageKm: 3000,
    usageUnit: 'km',
    storageLocation: 'Garage shelf',
    description: 'Good condition cassette',
  });

  it('renders item name', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Shimano Cassette')).toBeTruthy();
  });

  it('renders status badge', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Stored')).toBeTruthy();
  });

  it('renders category breadcrumb and specs', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText(/Components · Shimano/)).toBeTruthy();
    expect(getByText('105 R7000')).toBeTruthy();
  });

  it('renders availability chips', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Borrowable')).toBeTruthy();
    expect(getByText('Sellable')).toBeTruthy();
  });

  it('renders detail grid', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Good')).toBeTruthy();
    expect(getByText('2 years')).toBeTruthy();
    expect(getByText('3000 km')).toBeTruthy();
    expect(getByText('Garage shelf')).toBeTruthy();
  });

  it('renders description', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Good condition cassette')).toBeTruthy();
  });

  it('renders photo gallery placeholder when no photos', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('No photos')).toBeTruthy();
  });

  it('shows Mark as Sold when item is sellable and stored', () => {
    const { getByText } = renderWithProviders(
      <ItemDetail item={baseItem} photos={[]} onMarkSold={jest.fn()} />,
    );
    expect(getByText('Mark as Sold')).toBeTruthy();
  });

  it('shows Mark as Loaned when item is borrowable and stored', () => {
    const { getByText } = renderWithProviders(
      <ItemDetail item={baseItem} photos={[]} onMarkLoaned={jest.fn()} />,
    );
    expect(getByText('Mark as Loaned')).toBeTruthy();
  });

  it('shows Mark as Donated when item is donatable and stored', () => {
    const donatableItem = createMockItem({
      ...baseItem,
      availabilityTypes: [AvailabilityType.Donatable],
    });
    const { getByText } = renderWithProviders(
      <ItemDetail item={donatableItem} photos={[]} onMarkDonated={jest.fn()} />,
    );
    expect(getByText('Mark as Donated')).toBeTruthy();
  });

  it('hides Mark as Donated when item is not donatable', () => {
    const { queryByText } = renderWithProviders(
      <ItemDetail item={baseItem} photos={[]} onMarkDonated={jest.fn()} />,
    );
    expect(queryByText('Mark as Donated')).toBeNull();
  });

  it('hides Mark as Sold when item is not sellable', () => {
    const borrowOnlyItem = createMockItem({
      ...baseItem,
      availabilityTypes: [AvailabilityType.Borrowable],
    });
    const { queryByText } = renderWithProviders(
      <ItemDetail item={borrowOnlyItem} photos={[]} onMarkSold={jest.fn()} />,
    );
    expect(queryByText('Mark as Sold')).toBeNull();
  });

  it('shows Mark as Returned when item is borrowable and loaned', () => {
    const loanedItem = createMockItem({ ...baseItem, status: ItemStatus.Loaned });
    const { getByText } = renderWithProviders(
      <ItemDetail item={loanedItem} photos={[]} onMarkReturned={jest.fn()} />,
    );
    expect(getByText('Mark as Returned')).toBeTruthy();
  });

  it('hides Mark as Returned when item is loaned but not borrowable', () => {
    const loanedSellableItem = createMockItem({
      ...baseItem,
      status: ItemStatus.Loaned,
      availabilityTypes: [AvailabilityType.Sellable],
    });
    const { queryByText } = renderWithProviders(
      <ItemDetail item={loanedSellableItem} photos={[]} onMarkReturned={jest.fn()} />,
    );
    expect(queryByText('Mark as Returned')).toBeNull();
  });

  it('hides transaction actions when status is Loaned', () => {
    const loanedItem = createMockItem({ ...baseItem, status: ItemStatus.Loaned });
    const { queryByText } = renderWithProviders(
      <ItemDetail
        item={loanedItem}
        photos={[]}
        onMarkDonated={jest.fn()}
        onMarkSold={jest.fn()}
        onMarkLoaned={jest.fn()}
      />,
    );
    expect(queryByText('Mark as Donated')).toBeNull();
    expect(queryByText('Mark as Sold')).toBeNull();
    expect(queryByText('Mark as Loaned')).toBeNull();
  });

  it('shows no transaction buttons for private-only items', () => {
    const privateItem = createMockItem({
      ...baseItem,
      availabilityTypes: [AvailabilityType.Private],
    });
    const { queryByText } = renderWithProviders(
      <ItemDetail
        item={privateItem}
        photos={[]}
        onMarkDonated={jest.fn()}
        onMarkSold={jest.fn()}
        onMarkLoaned={jest.fn()}
        onMarkReturned={jest.fn()}
      />,
    );
    expect(queryByText('Mark as Donated')).toBeNull();
    expect(queryByText('Mark as Sold')).toBeNull();
    expect(queryByText('Mark as Loaned')).toBeNull();
    expect(queryByText('Mark as Returned')).toBeNull();
  });

  it('hides delete action when item cannot be deleted', () => {
    const loanedItem = createMockItem({ ...baseItem, status: ItemStatus.Loaned });
    const { queryByText } = renderWithProviders(
      <ItemDetail item={loanedItem} photos={[]} onDelete={jest.fn()} />,
    );
    expect(queryByText('Delete item')).toBeNull();
  });

  it('renders side-by-side layout on wide screens', () => {
    jest
      .spyOn(Dimensions, 'get')
      .mockReturnValue({ width: 1024, height: 768, scale: 1, fontScale: 1 });
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Shimano Cassette')).toBeTruthy();
    expect(getByText('No photos')).toBeTruthy();
  });

  it('renders stacked layout on narrow screens', () => {
    jest
      .spyOn(Dimensions, 'get')
      .mockReturnValue({ width: 375, height: 812, scale: 1, fontScale: 1 });
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Shimano Cassette')).toBeTruthy();
    expect(getByText('No photos')).toBeTruthy();
  });
});
