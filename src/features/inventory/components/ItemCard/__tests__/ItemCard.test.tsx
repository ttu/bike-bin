import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import {
  ItemStatus,
  ItemCategory,
  ItemCondition,
  AvailabilityType,
  Visibility,
} from '@/shared/types';
import { ItemCard } from '../ItemCard';

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

describe('ItemCard', () => {
  const baseItem = createMockItem({
    name: 'Shimano Cassette',
    category: ItemCategory.Component,
    subcategory: 'drivetrain',
    condition: ItemCondition.Good,
    status: ItemStatus.Stored,
    availabilityTypes: [AvailabilityType.Borrowable, AvailabilityType.Sellable],
    visibility: Visibility.Private,
  });

  it('renders item name', () => {
    const { getByText } = renderWithProviders(<ItemCard item={baseItem} />);
    expect(getByText('Shimano Cassette')).toBeTruthy();
  });

  it('renders category and subcategory', () => {
    const { getByText } = renderWithProviders(<ItemCard item={baseItem} />);
    expect(getByText(/Components · Drivetrain/)).toBeTruthy();
  });

  it('renders only category when no subcategory', () => {
    const item = createMockItem({
      name: 'Test Item',
      category: ItemCategory.Tool,
      subcategory: undefined,
      status: ItemStatus.Stored,
    });
    const { getByText } = renderWithProviders(<ItemCard item={item} />);
    expect(getByText('Tools')).toBeTruthy();
  });

  it('hides stored status badge (default)', () => {
    const { queryByText } = renderWithProviders(<ItemCard item={baseItem} />);
    expect(queryByText('Stored')).toBeNull();
  });

  it('renders non-default status badge', () => {
    const item = createMockItem({ status: ItemStatus.Mounted });
    const { getByText } = renderWithProviders(<ItemCard item={item} />);
    expect(getByText('Mounted')).toBeTruthy();
  });

  it('renders availability chips', () => {
    const { getByText } = renderWithProviders(<ItemCard item={baseItem} />);
    expect(getByText('Borrow')).toBeTruthy();
    expect(getByText('Sell')).toBeTruthy();
  });

  it('does not show Private availability chip (implicit default)', () => {
    const item = createMockItem({
      name: 'Solo',
      availabilityTypes: [AvailabilityType.Private, AvailabilityType.Borrowable],
    });
    const { getByText, queryByText } = renderWithProviders(<ItemCard item={item} />);
    expect(getByText('Borrow')).toBeTruthy();
    expect(queryByText('Private')).toBeNull();
  });

  it('renders all tags', () => {
    const item = createMockItem({
      name: 'Tagged',
      tags: ['shimano', 'road', '11-speed'],
    });
    const { getByText } = renderWithProviders(<ItemCard item={item} />);
    expect(getByText('shimano')).toBeTruthy();
    expect(getByText('road')).toBeTruthy();
    expect(getByText('11-speed')).toBeTruthy();
  });

  it('fires onPress with item', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderWithProviders(<ItemCard item={baseItem} onPress={onPress} />);
    fireEvent.press(getByLabelText('Shimano Cassette'));
    expect(onPress).toHaveBeenCalledWith(baseItem);
  });

  it('hides details in compact mode', () => {
    const item = createMockItem({
      ...baseItem,
      tags: ['tag-one'],
    });
    const { queryByText } = renderWithProviders(<ItemCard item={item} compact />);
    expect(queryByText(/Components · Drivetrain/)).toBeNull();
    expect(queryByText('Borrow')).toBeNull();
    expect(queryByText('tag-one')).toBeNull();
  });

  it.each([
    [ItemStatus.Loaned, 'Loaned'],
    [ItemStatus.Donated, 'Donated'],
  ])('renders correct status text for %s', (status, label) => {
    const item = createMockItem({ name: 'Test', status });
    const { getByText } = renderWithProviders(<ItemCard item={item} />);
    expect(getByText(label)).toBeTruthy();
  });
});
