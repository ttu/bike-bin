import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import GroupsScreen from '../../../../app/(tabs)/profile/groups/index';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })),
  },
}));

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

const mockRefetch = jest.fn();

jest.mock('@/features/groups', () => ({
  useGroups: () => ({ data: [], isLoading: false, refetch: mockRefetch }),
  useSearchGroups: () => ({ data: [], isLoading: false }),
  useCreateGroup: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useJoinGroup: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

describe('GroupsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty state and navigates back', () => {
    renderWithProviders(<GroupsScreen />);
    expect(screen.getByText('No groups yet')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Back'));
    expect(tabScopedBack).toHaveBeenCalledWith('/(tabs)/profile');
  });

  it('opens create mode and returns to list', () => {
    renderWithProviders(<GroupsScreen />);
    fireEvent.press(screen.getByText('Create group'));
    expect(screen.getByText('Group name')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Back'));
    expect(screen.getByText('Groups')).toBeTruthy();
  });

  it('opens search mode', () => {
    renderWithProviders(<GroupsScreen />);
    const headerButtons = screen.getAllByTestId('icon-button');
    fireEvent.press(headerButtons[headerButtons.length - 1]);
    expect(screen.getByPlaceholderText('Search public groups...')).toBeTruthy();
  });
});
