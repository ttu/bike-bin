import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import { ItemCategory, ItemStatus } from '@/shared/types';
import { ItemGalleryTile } from '../ItemGalleryTile';

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

describe('ItemGalleryTile', () => {
  const baseItem = createMockItem({
    name: 'Test Part',
    category: ItemCategory.Component,
    status: ItemStatus.Stored,
    thumbnailStoragePath: undefined,
  });

  it('invokes onPress with item', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <ItemGalleryTile item={baseItem} onPress={onPress} />,
    );
    fireEvent.press(getByLabelText('Test Part'));
    expect(onPress).toHaveBeenCalledWith(baseItem);
  });

  it('uses quantity-aware accessibility label when quantity > 1', () => {
    const item = createMockItem({
      ...baseItem,
      name: 'Bolts',
      quantity: 4,
    });
    const { getByLabelText } = renderWithProviders(<ItemGalleryTile item={item} />);
    expect(getByLabelText('Bolts, 4 identical items')).toBeTruthy();
  });

  it('shows item name in the tile when there is no thumbnail', () => {
    const { getByText } = renderWithProviders(<ItemGalleryTile item={baseItem} />);
    expect(getByText('Test Part')).toBeTruthy();
  });

  it('does not show name text when a thumbnail is present', () => {
    const item = createMockItem({
      ...baseItem,
      thumbnailStoragePath:
        'a1b2c3d4-0001-4000-8000-000000000001/d0000001-0001-4000-8000-000000000001/photo.jpg',
    });
    const { queryByText } = renderWithProviders(<ItemGalleryTile item={item} />);
    expect(queryByText('Test Part')).toBeNull();
  });
});
