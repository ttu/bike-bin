import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockSearchResultItem } from '@/test/factories';
import { AvailabilityType } from '@/shared/types';
import { SearchResultCard } from '../SearchResultCard/SearchResultCard';

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

describe('SearchResultCard', () => {
  it('renders item name', () => {
    const item = createMockSearchResultItem();
    const { getByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(getByText('Shimano Cassette')).toBeTruthy();
  });

  it('renders condition text', () => {
    const item = createMockSearchResultItem();
    const { getByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(getByText('Good')).toBeTruthy();
  });

  it('renders owner display name', () => {
    const item = createMockSearchResultItem({ ownerDisplayName: 'Alice' });
    const { getByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(getByText('Alice')).toBeTruthy();
  });

  it('renders availability chips', () => {
    const item = createMockSearchResultItem({
      availabilityTypes: [AvailabilityType.Borrowable, AvailabilityType.Sellable],
      price: 25,
    });
    const { getByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(getByText('Borrowable')).toBeTruthy();
    expect(getByText(/Sellable/)).toBeTruthy();
  });

  it('renders area name and distance', () => {
    const item = createMockSearchResultItem({ areaName: 'Kreuzberg', distanceMeters: 3200 });
    const { getByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(getByText(/Kreuzberg/)).toBeTruthy();
    expect(getByText(/3.2 km/)).toBeTruthy();
  });

  it('renders distance in meters when under 1km', () => {
    const item = createMockSearchResultItem({ distanceMeters: 500 });
    const { getByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(getByText(/500 m/)).toBeTruthy();
  });

  it('fires onPress with item', () => {
    const item = createMockSearchResultItem();
    const onPress = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <SearchResultCard item={item} onPress={onPress} />,
    );
    fireEvent.press(getByLabelText('Shimano Cassette'));
    expect(onPress).toHaveBeenCalledWith(item);
  });

  it('shows price for sellable items', () => {
    const item = createMockSearchResultItem({
      availabilityTypes: [AvailabilityType.Sellable],
      price: 42.5,
    });
    const { getByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(getByText(/42.5/)).toBeTruthy();
  });

  it('renders without owner name when undefined', () => {
    const item = createMockSearchResultItem({ ownerDisplayName: undefined });
    const { queryByText } = renderWithProviders(<SearchResultCard item={item} />);
    expect(queryByText('Alice')).toBeNull();
  });
});
