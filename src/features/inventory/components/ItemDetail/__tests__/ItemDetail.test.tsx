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
    storageLocation: 'Garage shelf',
    description: 'Good condition cassette',
  });

  it('renders item name as-is (visual uppercase via CSS)', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Shimano Cassette')).toBeTruthy();
  });

  it('renders meta row with brand · model · age', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Shimano · 105 R7000 · 2 years')).toBeTruthy();
  });

  it('renders service record stamp and condition row', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Service record')).toBeTruthy();
    expect(getByText('Condition')).toBeTruthy();
    expect(getByText('Good')).toBeTruthy();
  });

  it('renders location block', () => {
    const { getAllByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getAllByText('Garage shelf').length).toBeGreaterThan(0);
  });

  it('renders accent-tinted listing chips under Listed for', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Listed for')).toBeTruthy();
    expect(getByText('Borrow')).toBeTruthy();
    expect(getByText('Sell')).toBeTruthy();
  });

  it('hides stored status badge (default)', () => {
    const { queryByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(queryByText('Stored')).toBeNull();
  });

  it('renders non-default status badge', () => {
    const item = createMockItem({ ...baseItem, status: ItemStatus.Mounted });
    const { getByText } = renderWithProviders(<ItemDetail item={item} photos={[]} />);
    expect(getByText('Mounted')).toBeTruthy();
  });

  it('renders storage location in service record and location block', () => {
    const { getAllByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getAllByText('Garage shelf').length).toBeGreaterThan(0);
  });

  it('renders usage figure', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('3000')).toBeTruthy();
  });

  it('shows remaining fraction as display figure for consumables', () => {
    const item = createMockItem({
      category: ItemCategory.Consumable,
      subcategory: 'chain_lube',
      condition: ItemCondition.Good,
      remainingFraction: 0.4,
      usageKm: undefined,
    });
    const { getByText } = renderWithProviders(<ItemDetail item={item} photos={[]} />);
    expect(getByText('40')).toBeTruthy();
  });

  it('renders description', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Good condition cassette')).toBeTruthy();
  });

  it('renders photo gallery placeholder when no photos', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('No photos')).toBeTruthy();
  });

  it('shows Mark as Donated when item is donatable', () => {
    const onMarkDonated = jest.fn();
    const donatableItem = createMockItem({
      ...baseItem,
      availabilityTypes: [AvailabilityType.Borrowable, AvailabilityType.Donatable],
    });
    const { getByText } = renderWithProviders(
      <ItemDetail item={donatableItem} photos={[]} onMarkDonated={onMarkDonated} />,
    );
    expect(getByText('Mark as Donated')).toBeTruthy();
  });

  it('hides Mark as Donated when item is not donatable', () => {
    const { queryByText } = renderWithProviders(
      <ItemDetail item={baseItem} photos={[]} onMarkDonated={jest.fn()} />,
    );
    expect(queryByText('Mark as Donated')).toBeNull();
  });

  it('shows Mark as Returned when Loaned', () => {
    const loanedItem = createMockItem({ ...baseItem, status: ItemStatus.Loaned });
    const onMarkReturned = jest.fn();
    const { getByText } = renderWithProviders(
      <ItemDetail item={loanedItem} photos={[]} onMarkReturned={onMarkReturned} />,
    );
    expect(getByText('Mark as Returned')).toBeTruthy();
  });

  it('hides Donated/Sold actions when status is Loaned', () => {
    const loanedItem = createMockItem({ ...baseItem, status: ItemStatus.Loaned });
    const { queryByText } = renderWithProviders(
      <ItemDetail item={loanedItem} photos={[]} onMarkDonated={jest.fn()} onMarkSold={jest.fn()} />,
    );
    expect(queryByText('Mark as Donated')).toBeNull();
    expect(queryByText('Mark as Sold')).toBeNull();
  });

  it('hides Mark as Sold when item is not sellable', () => {
    const donatableOnly = createMockItem({
      ...baseItem,
      availabilityTypes: [AvailabilityType.Donatable],
    });
    const { queryByText, getByText } = renderWithProviders(
      <ItemDetail
        item={donatableOnly}
        photos={[]}
        onMarkDonated={jest.fn()}
        onMarkSold={jest.fn()}
      />,
    );
    expect(getByText('Mark as Donated')).toBeTruthy();
    expect(queryByText('Mark as Sold')).toBeNull();
  });

  it('does not show standalone delete label when using remove-from-bin only', () => {
    const loanedItem = createMockItem({ ...baseItem, status: ItemStatus.Loaned });
    const { queryByText, getByText } = renderWithProviders(
      <ItemDetail item={loanedItem} photos={[]} onRemoveFromBin={jest.fn()} />,
    );
    expect(queryByText('Delete item')).toBeNull();
    expect(getByText('Remove from inventory')).toBeTruthy();
  });

  it('shows Remove from inventory when onRemoveFromBin is provided', () => {
    const { getByText } = renderWithProviders(
      <ItemDetail item={baseItem} photos={[]} onRemoveFromBin={jest.fn()} />,
    );
    expect(getByText('Remove from inventory')).toBeTruthy();
  });

  it('shows Restore to inventory when archived and onUnarchive is provided', () => {
    const archived = createMockItem({ ...baseItem, status: ItemStatus.Archived });
    const { getByText } = renderWithProviders(
      <ItemDetail item={archived} photos={[]} onUnarchive={jest.fn()} />,
    );
    expect(getByText('Restore to inventory')).toBeTruthy();
  });

  it('hides Restore to inventory when not archived', () => {
    const { queryByText } = renderWithProviders(
      <ItemDetail item={baseItem} photos={[]} onUnarchive={jest.fn()} />,
    );
    expect(queryByText('Restore to inventory')).toBeNull();
  });

  it('renders item tags', () => {
    const taggedItem = createMockItem({ ...baseItem, tags: ['Road', 'Gravel'] });
    const { getByText } = renderWithProviders(<ItemDetail item={taggedItem} photos={[]} />);
    expect(getByText('Road')).toBeTruthy();
    expect(getByText('Gravel')).toBeTruthy();
  });

  it('renders centered wide column layout on wide screens', () => {
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
