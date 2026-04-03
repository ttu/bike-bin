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
});
