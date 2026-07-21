jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test/${path}` } }),
      }),
    },
  },
}));

import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockConversationListItem } from '@/test/factories';
import type { GroupId } from '@/shared/types';
import { ItemContextStrip } from '../ItemContextStrip/ItemContextStrip';

describe('ItemContextStrip', () => {
  it('renders the item name', () => {
    const conv = createMockConversationListItem();
    const { getByText } = renderWithProviders(<ItemContextStrip conversation={conv} />);
    expect(getByText('Shimano XT Derailleur')).toBeTruthy();
  });

  it('returns null when there is no item attached', () => {
    const conv = createMockConversationListItem({ itemId: undefined, itemName: undefined });
    const { queryByTestId } = renderWithProviders(<ItemContextStrip conversation={conv} />);
    expect(queryByTestId('item-context-strip')).toBeNull();
  });

  it('renders the group affiliation chip when itemGroupId is set', () => {
    const conv = createMockConversationListItem({
      itemGroupId: 'group-1' as GroupId,
      groupName: 'Kallio CC',
    });
    const { getByText } = renderWithProviders(<ItemContextStrip conversation={conv} />);
    expect(getByText('Group · Kallio CC')).toBeTruthy();
  });

  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    const conv = createMockConversationListItem();
    const { getByTestId } = renderWithProviders(
      <ItemContextStrip conversation={conv} onPress={onPress} />,
    );
    fireEvent.press(getByTestId('item-context-strip'));
    expect(onPress).toHaveBeenCalled();
  });

  it.each([
    { itemStatus: 'loaned', context: 'Borrow · accepted', chip: 'Loaned' },
    { itemStatus: 'reserved', context: 'Borrow · accepted', chip: 'Reserved' },
    { itemStatus: 'donated', context: 'Donation · accepted', chip: 'Donated' },
  ])(
    'renders "$context" and a "$chip" status chip for $itemStatus items',
    ({ itemStatus, context, chip }) => {
      const conv = createMockConversationListItem({ itemStatus });
      const { getByText } = renderWithProviders(<ItemContextStrip conversation={conv} />);
      expect(getByText(context)).toBeTruthy();
      expect(getByText(chip)).toBeTruthy();
    },
  );

  it('renders sale context and success status chip for sold items', () => {
    const conv = createMockConversationListItem({ itemStatus: 'sold' });
    const { getByText } = renderWithProviders(<ItemContextStrip conversation={conv} />);
    expect(getByText('Sale · accepted')).toBeTruthy();
  });

  it('renders stored context for mounted items without status chip', () => {
    const conv = createMockConversationListItem({ itemStatus: 'mounted' });
    const { getByText, queryByText } = renderWithProviders(
      <ItemContextStrip conversation={conv} />,
    );
    expect(getByText('Available')).toBeTruthy();
    expect(queryByText('Mounted')).toBeNull();
  });

  it('omits context stamp for unrecognized status (e.g. archived)', () => {
    const conv = createMockConversationListItem({ itemStatus: 'archived' });
    const { queryByText } = renderWithProviders(<ItemContextStrip conversation={conv} />);
    expect(queryByText('Available')).toBeNull();
    expect(queryByText('Borrow · accepted')).toBeNull();
  });

  it('renders a thumbnail image when itemPhotoPath is set', () => {
    const conv = createMockConversationListItem({ itemPhotoPath: 'photos/x.jpg' });
    const { getByTestId } = renderWithProviders(<ItemContextStrip conversation={conv} />);
    expect(getByTestId('item-context-strip')).toBeTruthy();
  });

  it('does not expose button a11y role when non-pressable', () => {
    const conv = createMockConversationListItem();
    const { getByTestId } = renderWithProviders(<ItemContextStrip conversation={conv} />);
    const node = getByTestId('item-context-strip');
    expect(node.props.accessibilityRole).toBeUndefined();
  });
});
