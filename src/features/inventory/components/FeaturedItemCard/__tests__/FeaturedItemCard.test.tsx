import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import { ItemCategory, ItemCondition, ItemStatus } from '@/shared/types';
import { FeaturedItemCard } from '../FeaturedItemCard';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://test.supabase.co/storage/item-photos/${path}` },
        }),
      }),
    },
  },
}));

describe('FeaturedItemCard', () => {
  const baseItem = createMockItem({
    name: 'Carbon Fork',
    category: ItemCategory.Component,
    subcategory: 'fork',
    brand: 'BrandX',
    status: ItemStatus.Stored,
    condition: ItemCondition.Good,
    quantity: 1,
    thumbnailStoragePath: undefined,
  });

  it('renders item name and calls onPress', () => {
    const onPress = jest.fn();
    renderWithProviders(<FeaturedItemCard item={baseItem} onPress={onPress} />);
    expect(screen.getByText('Carbon Fork')).toBeTruthy();
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledWith(baseItem);
  });

  it('is non-interactive when no onPress provided', () => {
    renderWithProviders(<FeaturedItemCard item={baseItem} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows badgeLabel when provided', () => {
    renderWithProviders(<FeaturedItemCard item={baseItem} badgeLabel="Recently added" />);
    expect(screen.getByText('Recently added')).toBeTruthy();
  });

  it('omits badge when badgeLabel is not provided', () => {
    renderWithProviders(<FeaturedItemCard item={baseItem} />);
    expect(screen.queryByText('Recently added')).toBeNull();
  });

  it('shows status badge for loaned item (warning color path)', () => {
    const item = createMockItem({ ...baseItem, status: ItemStatus.Loaned });
    renderWithProviders(<FeaturedItemCard item={item} />);
    expect(screen.getByText('Loaned')).toBeTruthy();
  });

  it('shows status badge for donated item (success color path)', () => {
    const item = createMockItem({ ...baseItem, status: ItemStatus.Donated });
    renderWithProviders(<FeaturedItemCard item={item} />);
    expect(screen.getByText('Donated')).toBeTruthy();
  });

  it('shows quantity spec when quantity > 1', () => {
    const item = createMockItem({ ...baseItem, quantity: 3 });
    renderWithProviders(<FeaturedItemCard item={item} />);
    expect(screen.getByText('×3')).toBeTruthy();
  });

  it('renders correctly when thumbnailStoragePath is set', () => {
    const item = createMockItem({
      ...baseItem,
      thumbnailStoragePath:
        'a1b2c3d4-0001-4000-8000-000000000001/d0000001-0001-4000-8000-000000000001/photo.jpg',
    });
    renderWithProviders(<FeaturedItemCard item={item} />);
    expect(screen.getByText('Carbon Fork')).toBeTruthy();
  });
});
