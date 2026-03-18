import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import { ItemStatus, ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import { ItemCard } from '../ItemCard';

describe('ItemCard', () => {
  const baseItem = createMockItem({
    name: 'Shimano Cassette',
    category: ItemCategory.Component,
    condition: ItemCondition.Good,
    status: ItemStatus.Stored,
    availabilityTypes: [AvailabilityType.Borrowable, AvailabilityType.Sellable],
  });

  it('renders item name', () => {
    const { getByText } = renderWithProviders(<ItemCard item={baseItem} />);
    expect(getByText('Shimano Cassette')).toBeTruthy();
  });

  it('renders category and condition', () => {
    const { getByText } = renderWithProviders(<ItemCard item={baseItem} />);
    expect(getByText(/Components · Good/)).toBeTruthy();
  });

  it('renders status badge', () => {
    const { getByText } = renderWithProviders(<ItemCard item={baseItem} />);
    expect(getByText('Stored')).toBeTruthy();
  });

  it('renders availability chips', () => {
    const { getByText } = renderWithProviders(<ItemCard item={baseItem} />);
    expect(getByText('Borrowable')).toBeTruthy();
    expect(getByText('Sellable')).toBeTruthy();
  });

  it('fires onPress with item', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderWithProviders(<ItemCard item={baseItem} onPress={onPress} />);
    fireEvent.press(getByLabelText('Shimano Cassette'));
    expect(onPress).toHaveBeenCalledWith(baseItem);
  });

  it('hides details in compact mode', () => {
    const { queryByText } = renderWithProviders(<ItemCard item={baseItem} compact />);
    expect(queryByText(/Components · Good/)).toBeNull();
    expect(queryByText('Borrowable')).toBeNull();
  });

  it.each([
    [ItemStatus.Stored, 'Stored'],
    [ItemStatus.Loaned, 'Loaned'],
    [ItemStatus.Donated, 'Donated'],
  ])('renders correct status text for %s', (status, label) => {
    const item = createMockItem({ name: 'Test', status });
    const { getByText } = renderWithProviders(<ItemCard item={item} />);
    expect(getByText(label)).toBeTruthy();
  });
});
