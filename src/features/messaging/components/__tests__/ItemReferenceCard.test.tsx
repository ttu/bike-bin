import { renderWithProviders } from '@/test/utils';
import { fireEvent } from '@testing-library/react-native';
import { createMockConversationListItem } from '@/test/factories';
import { ItemReferenceCard } from '../ItemReferenceCard/ItemReferenceCard';
import type { ConversationListItem } from '../../types';

function itemRefConversation(overrides?: Partial<ConversationListItem>) {
  return createMockConversationListItem({
    itemName: 'Shimano Pedals',
    itemAvailabilityTypes: undefined,
    otherParticipantName: undefined,
    lastMessageBody: undefined,
    lastMessageSenderId: undefined,
    lastMessageAt: undefined,
    createdAt: '2026-03-15T10:00:00Z',
    ...overrides,
  });
}

describe('ItemReferenceCard', () => {
  it('renders item name', () => {
    const { getByText } = renderWithProviders(
      <ItemReferenceCard conversation={itemRefConversation()} />,
    );
    expect(getByText('Shimano Pedals')).toBeTruthy();
  });

  it('returns null when no itemId', () => {
    const { queryByText } = renderWithProviders(
      <ItemReferenceCard conversation={itemRefConversation({ itemId: undefined })} />,
    );
    expect(queryByText('Shimano Pedals')).toBeNull();
  });

  it('returns null when no itemName', () => {
    const { queryByText } = renderWithProviders(
      <ItemReferenceCard conversation={itemRefConversation({ itemName: undefined })} />,
    );
    expect(queryByText('Shimano Pedals')).toBeNull();
  });

  it('calls onViewItem when pressed', () => {
    const onViewItem = jest.fn();
    const { getByRole } = renderWithProviders(
      <ItemReferenceCard conversation={itemRefConversation()} onViewItem={onViewItem} />,
    );
    fireEvent.press(getByRole('link'));
    expect(onViewItem).toHaveBeenCalled();
  });
});
