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
});
