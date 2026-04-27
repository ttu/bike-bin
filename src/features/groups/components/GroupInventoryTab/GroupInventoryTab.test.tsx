import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import { mockAuthModule } from '@/test/authMocks';
import { GroupRole, type GroupId, type UserId } from '@/shared/types';

const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
}));

jest.mock('@/features/auth', () => mockAuthModule);

const mockUseGroupItems = jest.fn();
const mockUseGroupMembers = jest.fn();

jest.mock('@/features/inventory/hooks/useGroupItems', () => ({
  useGroupItems: (...args: unknown[]) => mockUseGroupItems(...args),
}));

jest.mock('@/features/groups/hooks/useGroupMembers', () => ({
  useGroupMembers: (...args: unknown[]) => mockUseGroupMembers(...args),
}));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test/${path}` } }),
      }),
    },
  },
}));

import { GroupInventoryTab } from '../GroupInventoryTab';

const GROUP_ID = 'group-1' as GroupId;

beforeEach(() => {
  jest.clearAllMocks();
  mockRouterPush.mockClear();
});

function setupMembers(role: 'admin' | 'member') {
  mockUseGroupMembers.mockReturnValue({
    data: [
      {
        groupId: GROUP_ID,
        userId: 'user-123' as UserId,
        role: role === 'admin' ? GroupRole.Admin : GroupRole.Member,
        joinedAt: '2026-01-01T00:00:00Z',
        profile: { displayName: 'Me', avatarUrl: undefined },
      },
    ],
  });
}

describe('GroupInventoryTab', () => {
  it('renders items returned by useGroupItems', () => {
    mockUseGroupItems.mockReturnValue({
      data: [createMockItem({ name: 'Shared Helmet', groupId: GROUP_ID, ownerId: undefined })],
      isLoading: false,
      refetch: jest.fn(),
    });
    setupMembers('member');

    const { getByText } = renderWithProviders(<GroupInventoryTab groupId={GROUP_ID} />);
    expect(getByText('Shared Helmet')).toBeTruthy();
  });

  it('shows an empty state when there are no items', () => {
    mockUseGroupItems.mockReturnValue({ data: [], isLoading: false, refetch: jest.fn() });
    setupMembers('member');

    const { getByText } = renderWithProviders(<GroupInventoryTab groupId={GROUP_ID} />);
    expect(getByText('No items in this group yet')).toBeTruthy();
  });

  it('renders the add-item FAB for admins', () => {
    mockUseGroupItems.mockReturnValue({
      data: [createMockItem({ name: 'Shared Helmet', groupId: GROUP_ID, ownerId: undefined })],
      isLoading: false,
      refetch: jest.fn(),
    });
    setupMembers('admin');

    const { getByLabelText } = renderWithProviders(<GroupInventoryTab groupId={GROUP_ID} />);
    expect(getByLabelText('Add group item')).toBeTruthy();
  });

  it('hides the add-item FAB for non-admins', () => {
    mockUseGroupItems.mockReturnValue({
      data: [createMockItem({ name: 'Shared Helmet', groupId: GROUP_ID, ownerId: undefined })],
      isLoading: false,
      refetch: jest.fn(),
    });
    setupMembers('member');

    const { queryByLabelText } = renderWithProviders(<GroupInventoryTab groupId={GROUP_ID} />);
    expect(queryByLabelText('Add group item')).toBeNull();
  });

  it('opens new inventory with groupId when admin taps the FAB', () => {
    mockUseGroupItems.mockReturnValue({
      data: [createMockItem({ name: 'Shared Helmet', groupId: GROUP_ID, ownerId: undefined })],
      isLoading: false,
      refetch: jest.fn(),
    });
    setupMembers('admin');

    const { getByLabelText } = renderWithProviders(<GroupInventoryTab groupId={GROUP_ID} />);
    fireEvent.press(getByLabelText('Add group item'));

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/inventory/new',
      params: { groupId: GROUP_ID },
    });
  });
});
