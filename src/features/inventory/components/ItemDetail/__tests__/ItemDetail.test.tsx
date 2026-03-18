import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import { ItemStatus, ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import { ItemDetail } from '../ItemDetail';

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

  it('renders item name', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Shimano Cassette')).toBeTruthy();
  });

  it('renders status badge', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Stored')).toBeTruthy();
  });

  it('renders category, brand, and model', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText(/Components · Shimano · 105 R7000/)).toBeTruthy();
  });

  it('renders availability chips with price', () => {
    const { getByText } = renderWithProviders(<ItemDetail item={baseItem} photos={[]} />);
    expect(getByText('Borrowable')).toBeTruthy();
    expect(getByText(/Sellable · €45/)).toBeTruthy();
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

  it('shows Mark as Donated when status allows', () => {
    const onMarkDonated = jest.fn();
    const { getByText } = renderWithProviders(
      <ItemDetail item={baseItem} photos={[]} onMarkDonated={onMarkDonated} />,
    );
    expect(getByText('Mark as Donated')).toBeTruthy();
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

  it('hides delete action when item cannot be deleted', () => {
    const loanedItem = createMockItem({ ...baseItem, status: ItemStatus.Loaned });
    const { queryByText } = renderWithProviders(
      <ItemDetail item={loanedItem} photos={[]} onDelete={jest.fn()} />,
    );
    expect(queryByText('Delete item')).toBeNull();
  });
});
