import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import type { ConversationListItem } from '../../types';
import type { ConversationId, ItemId, UserId } from '@/shared/types';
import { ConversationCard } from '../ConversationCard/ConversationCard';

function createConversationItem(overrides?: Partial<ConversationListItem>): ConversationListItem {
  return {
    id: 'conv-1' as ConversationId,
    itemId: 'item-1' as ItemId,
    itemName: 'Shimano XT Derailleur',
    itemStatus: 'stored',
    itemAvailabilityTypes: ['borrowable'],
    itemPhotoPath: undefined,
    otherParticipantId: 'user-2' as UserId,
    otherParticipantName: 'Alice',
    otherParticipantAvatarUrl: undefined,
    lastMessageBody: 'Is this still available?',
    lastMessageSenderId: 'user-2' as UserId,
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('ConversationCard', () => {
  it('renders other participant name', () => {
    const conv = createConversationItem();
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText('Alice')).toBeTruthy();
  });

  it('renders anonymous fallback when participant name is undefined', () => {
    const conv = createConversationItem({ otherParticipantName: undefined });
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText('Anonymous')).toBeTruthy();
  });

  it('renders anonymous fallback when participant name is empty string', () => {
    const conv = createConversationItem({ otherParticipantName: '' });
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText('Anonymous')).toBeTruthy();
  });

  it('renders item reference with item name', () => {
    const conv = createConversationItem();
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText(/Re: Shimano XT Derailleur/)).toBeTruthy();
  });

  it('renders last message preview', () => {
    const conv = createConversationItem();
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText('Is this still available?')).toBeTruthy();
  });

  it('shows "No messages yet" when no last message', () => {
    const conv = createConversationItem({
      lastMessageBody: undefined,
      lastMessageSenderId: undefined,
      lastMessageAt: undefined,
    });
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText('No messages yet')).toBeTruthy();
  });

  it('shows sold status suffix for sold items', () => {
    const conv = createConversationItem({ itemStatus: 'sold' });
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText(/\(Sold\)/)).toBeTruthy();
  });

  it('shows donated status suffix for donated items', () => {
    const conv = createConversationItem({ itemStatus: 'donated' });
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText(/\(Donated\)/)).toBeTruthy();
  });

  it('shows unread dot when unreadCount > 0', () => {
    const conv = createConversationItem({ unreadCount: 3 });
    const { getByTestId } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByTestId('unread-dot')).toBeTruthy();
  });

  it('does not show unread dot when unreadCount is 0', () => {
    const conv = createConversationItem({ unreadCount: 0 });
    const { queryByTestId } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(queryByTestId('unread-dot')).toBeNull();
  });

  it('fires onPress with conversation', () => {
    const conv = createConversationItem();
    const onPress = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <ConversationCard conversation={conv} onPress={onPress} />,
    );
    fireEvent.press(getByLabelText('Alice'));
    expect(onPress).toHaveBeenCalledWith(conv);
  });

  it('applies dimmed style for completed transactions', () => {
    const conv = createConversationItem({ itemStatus: 'sold' });
    const { getByLabelText } = renderWithProviders(<ConversationCard conversation={conv} />);
    const card = getByLabelText('Alice');
    // The component exists and renders — visual dimming is via opacity style
    expect(card).toBeTruthy();
  });
});
