import type { MessageRow } from '@/shared/types';
import { mapMessageRow } from '../mapMessageRow';

describe('mapMessageRow', () => {
  const row: MessageRow = {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'user-A',
    body: 'Hey, is this part still available?',
    created_at: '2026-01-01T12:00:00Z',
  };

  it('maps fields and sets isOwn=true when sender is current user', () => {
    const result = mapMessageRow(row, 'user-A');
    expect(result).toEqual({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-A',
      body: 'Hey, is this part still available?',
      createdAt: '2026-01-01T12:00:00Z',
      isOwn: true,
    });
  });

  it('sets isOwn=false when sender is different user', () => {
    const result = mapMessageRow(row, 'user-B');
    expect(result.isOwn).toBe(false);
  });

  it('maps anonymized message (null sender_id) as not own', () => {
    const anonymized: MessageRow = { ...row, sender_id: null };
    const result = mapMessageRow(anonymized, 'user-A');
    expect(result.senderId).toBeUndefined();
    expect(result.isOwn).toBe(false);
  });
});
