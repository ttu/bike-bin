import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import type { MessageWithSender } from '../../types';
import type { ConversationId, MessageId, UserId } from '@/shared/types';
import { ChatBubble } from '../ChatBubble/ChatBubble';

function createMessage(overrides?: Partial<MessageWithSender>): MessageWithSender {
  return {
    id: 'msg-1' as MessageId,
    conversationId: 'conv-1' as ConversationId,
    senderId: 'user-1' as UserId,
    body: 'Hello, is this available?',
    createdAt: '2026-03-18T10:30:00Z',
    isOwn: false,
    ...overrides,
  };
}

describe('ChatBubble', () => {
  it('renders message body', () => {
    const msg = createMessage();
    const { getByText } = renderWithProviders(<ChatBubble message={msg} />);
    expect(getByText('Hello, is this available?')).toBeTruthy();
  });

  it('renders own message body', () => {
    const msg = createMessage({ isOwn: true, body: 'Yes it is!' });
    const { getByText } = renderWithProviders(<ChatBubble message={msg} />);
    expect(getByText('Yes it is!')).toBeTruthy();
  });

  it('renders timestamp', () => {
    const msg = createMessage({ createdAt: '2026-03-18T10:30:00Z' });
    const { getByText } = renderWithProviders(<ChatBubble message={msg} />);
    // The timestamp format depends on locale (may use : or . as separator)
    expect(getByText(/\d{1,2}[.:]\d{2}/)).toBeTruthy();
  });

  it('has accessibility label with message body', () => {
    const msg = createMessage({ body: 'Test message' });
    const { getByLabelText } = renderWithProviders(<ChatBubble message={msg} />);
    expect(getByLabelText('Test message')).toBeTruthy();
  });

  it('renders incoming message (not own)', () => {
    const msg = createMessage({ isOwn: false });
    const { getByLabelText } = renderWithProviders(<ChatBubble message={msg} />);
    // Component renders successfully for incoming message
    expect(getByLabelText(msg.body)).toBeTruthy();
  });

  it('calls onLongPress with the message when long-pressed', () => {
    const onLongPress = jest.fn();
    const msg = createMessage({ body: 'Report me' });
    const { getByLabelText } = renderWithProviders(
      <ChatBubble message={msg} onLongPress={onLongPress} />,
    );
    fireEvent(getByLabelText('Report me'), 'longPress');
    expect(onLongPress).toHaveBeenCalledWith(msg);
  });

  it('renders outgoing message (own)', () => {
    const msg = createMessage({ isOwn: true, body: 'My message' });
    const { getByLabelText } = renderWithProviders(<ChatBubble message={msg} />);
    expect(getByLabelText('My message')).toBeTruthy();
  });
});
