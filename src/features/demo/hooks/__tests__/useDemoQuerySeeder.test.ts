import { QueryClient } from '@tanstack/react-query';
import { seedDemoData, clearDemoData } from '../useDemoQuerySeeder';

jest.mock('../../data', () => ({
  DEMO_USER_ID: 'demo-user',
  DEMO_PROFILE: { id: 'demo-user', displayName: 'Demo User' },
  DEMO_ITEMS: [{ id: 'item-1', name: 'Pedals' }],
  DEMO_BIKES: [{ id: 'bike-1', name: 'Gravel' }],
  DEMO_CONVERSATIONS: [{ id: 'conv-1' }],
  DEMO_MESSAGES: { 'conv-1': [{ id: 'msg-1', body: 'Hello' }] },
  DEMO_BORROW_REQUESTS: [{ id: 'borrow-1' }],
  DEMO_UNREAD_MESSAGE_COUNT: 3,
  DEMO_UNREAD_NOTIFICATION_COUNT: 1,
  DEMO_LOCATIONS: [{ id: 'loc-1', isPrimary: true }],
}));

describe('seedDemoData', () => {
  it('populates query cache with demo fixtures', () => {
    const qc = new QueryClient();

    seedDemoData(qc);

    expect(qc.getQueryData(['items', 'demo-user'])).toEqual([{ id: 'item-1', name: 'Pedals' }]);
    expect(qc.getQueryData(['bikes', 'demo-user'])).toEqual([{ id: 'bike-1', name: 'Gravel' }]);
    expect(qc.getQueryData(['conversations', 'demo-user'])).toEqual([{ id: 'conv-1' }]);
    expect(qc.getQueryData(['borrowRequests', 'demo-user'])).toEqual([{ id: 'borrow-1' }]);
    expect(qc.getQueryData(['unread_message_count', 'demo-user'])).toBe(3);
    expect(qc.getQueryData(['profile', 'demo-user'])).toEqual({
      id: 'demo-user',
      displayName: 'Demo User',
    });
  });

  it('sets individual item entries', () => {
    const qc = new QueryClient();
    seedDemoData(qc);

    expect(qc.getQueryData(['items', 'item-1'])).toEqual({ id: 'item-1', name: 'Pedals' });
    expect(qc.getQueryData(['bikes', 'bike-1'])).toEqual({ id: 'bike-1', name: 'Gravel' });
  });

  it('sets staleTime to Infinity on seeded keys without affecting global defaults', () => {
    const qc = new QueryClient();
    const originalStaleTime = qc.getDefaultOptions().queries?.staleTime;

    seedDemoData(qc);

    expect(qc.getQueryDefaults(['items', 'demo-user']).staleTime).toBe(Infinity);
    expect(qc.getQueryDefaults(['profile', 'demo-user']).staleTime).toBe(Infinity);
    expect(qc.getDefaultOptions().queries?.staleTime).toBe(originalStaleTime);
  });
});

describe('clearDemoData', () => {
  it('clears cache without mutating the global staleTime', () => {
    const qc = new QueryClient();
    const originalStaleTime = qc.getDefaultOptions().queries?.staleTime;

    seedDemoData(qc);
    clearDemoData(qc);

    expect(qc.getQueryData(['items', 'demo-user'])).toBeUndefined();
    expect(qc.getDefaultOptions().queries?.staleTime).toBe(originalStaleTime);
  });
});
