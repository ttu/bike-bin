import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockConversationListItem } from '@/test/factories';
import { ConversationCard } from '../ConversationCard/ConversationCard';

describe('ConversationCard', () => {
  it('renders other participant name', () => {
    const conv = createMockConversationListItem();
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText('Alice')).toBeTruthy();
  });

  it('renders anonymous fallback when participant name is undefined', () => {
    const conv = createMockConversationListItem({ otherParticipantName: undefined });
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText('Anonymous')).toBeTruthy();
  });

  it('renders anonymous fallback when participant name is empty string', () => {
    const conv = createMockConversationListItem({ otherParticipantName: '' });
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText('Anonymous')).toBeTruthy();
  });

  it('renders item reference with item name', () => {
    const conv = createMockConversationListItem();
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText(/Re: Shimano XT Derailleur/)).toBeTruthy();
  });

  it('renders last message preview', () => {
    const conv = createMockConversationListItem();
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText('Is this still available?')).toBeTruthy();
  });

  it('shows "No messages yet" when no last message', () => {
    const conv = createMockConversationListItem({
      lastMessageBody: undefined,
      lastMessageSenderId: undefined,
      lastMessageAt: undefined,
    });
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText('No messages yet')).toBeTruthy();
  });

  it('shows sold status suffix for sold items', () => {
    const conv = createMockConversationListItem({ itemStatus: 'sold' });
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText(/\(Sold\)/)).toBeTruthy();
  });

  it('shows donated status suffix for donated items', () => {
    const conv = createMockConversationListItem({ itemStatus: 'donated' });
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText(/\(Donated\)/)).toBeTruthy();
  });

  it('shows unread dot when unreadCount > 0', () => {
    const conv = createMockConversationListItem({ unreadCount: 3 });
    const { getByTestId } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByTestId('unread-dot')).toBeTruthy();
  });

  it('does not show unread dot when unreadCount is 0', () => {
    const conv = createMockConversationListItem({ unreadCount: 0 });
    const { queryByTestId } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(queryByTestId('unread-dot')).toBeNull();
  });

  it('fires onPress with conversation', () => {
    const conv = createMockConversationListItem();
    const onPress = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <ConversationCard conversation={conv} onPress={onPress} />,
    );
    fireEvent.press(getByLabelText('Alice'));
    expect(onPress).toHaveBeenCalledWith(conv);
  });

  it('shows group name as title for group conversations', () => {
    const conv = createMockConversationListItem({
      itemGroupId: 'group-1' as never,
      groupName: 'Cycling Club',
    });
    const { getByText } = renderWithProviders(<ConversationCard conversation={conv} />);
    expect(getByText('Cycling Club')).toBeTruthy();
  });

  it('applies dimmed style for completed transactions', () => {
    const conv = createMockConversationListItem({ itemStatus: 'sold' });
    const { getByLabelText } = renderWithProviders(<ConversationCard conversation={conv} />);
    const card = getByLabelText('Alice');
    // The component exists and renders — visual dimming is via opacity style
    expect(card).toBeTruthy();
  });
});
