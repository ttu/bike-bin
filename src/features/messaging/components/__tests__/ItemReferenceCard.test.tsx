import { renderWithProviders } from '@/test/utils';
import { fireEvent } from '@testing-library/react-native';
import { ItemReferenceCard } from '../ItemReferenceCard/ItemReferenceCard';
import type { ConversationListItem } from '../../types';
import type { ConversationId, ItemId, UserId } from '@/shared/types';

function createConversation(overrides?: Partial<ConversationListItem>): ConversationListItem {
  return {
    id: 'conv-1' as ConversationId,
    itemId: 'item-1' as ItemId,
    itemName: 'Shimano Pedals',
    itemStatus: 'stored',
    itemAvailabilityTypes: undefined,
    itemPhotoPath: undefined,
    otherParticipantId: 'user-2' as UserId,
    otherParticipantName: undefined,
    otherParticipantAvatarUrl: undefined,
    lastMessageBody: undefined,
    lastMessageSenderId: undefined,
    lastMessageAt: undefined,
    unreadCount: 0,
    createdAt: '2026-03-15T10:00:00Z',
    ...overrides,
  };
}

describe('ItemReferenceCard', () => {
  it('renders item name', () => {
    const { getByText } = renderWithProviders(
      <ItemReferenceCard conversation={createConversation()} />,
    );
    expect(getByText('Shimano Pedals')).toBeTruthy();
  });

  it('returns null when no itemId', () => {
    const { queryByText } = renderWithProviders(
      <ItemReferenceCard conversation={createConversation({ itemId: undefined })} />,
    );
    expect(queryByText('Shimano Pedals')).toBeNull();
  });

  it('returns null when no itemName', () => {
    const { queryByText } = renderWithProviders(
      <ItemReferenceCard conversation={createConversation({ itemName: undefined })} />,
    );
    expect(queryByText('Shimano Pedals')).toBeNull();
  });

  it('calls onViewItem when pressed', () => {
    const onViewItem = jest.fn();
    const { getByRole } = renderWithProviders(
      <ItemReferenceCard conversation={createConversation()} onViewItem={onViewItem} />,
    );
    fireEvent.press(getByRole('link'));
    expect(onViewItem).toHaveBeenCalled();
  });
});
