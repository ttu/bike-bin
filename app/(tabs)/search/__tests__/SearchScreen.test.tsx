import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockSearchResultItem } from '@/test/factories';
import type { ItemId } from '@/shared/types';
import commonEn from '@/i18n/en/common.json';
import searchEn from '@/i18n/en/search.json';
import SearchScreen from '../index';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useLocalSearchParams: jest.fn(() => ({})),
  router: { push: jest.fn() },
}));

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

jest.mock('@/features/locations', () => ({
  usePrimaryLocation: () => ({ data: undefined }),
}));

jest.mock('@/features/demo', () => {
  const actual = jest.requireActual<typeof import('@/features/demo')>('@/features/demo');
  return {
    ...actual,
    useDemoMode: () => ({
      isDemoMode: false,
      enterDemoMode: jest.fn(),
      exitDemoMode: jest.fn(),
    }),
  };
});

const mockAuthState = {
  user: undefined as { id: string } | undefined,
  isAuthenticated: false,
  session: undefined as Record<string, unknown> | undefined,
  isLoading: true,
};

jest.mock('@/features/auth', () => ({
  useAuth: () => mockAuthState,
}));

const mockSearchItemsState = {
  data: undefined as unknown[] | undefined,
  isLoading: false,
};

jest.mock('@/features/search', () => {
  const actual = jest.requireActual<typeof import('@/features/search')>('@/features/search');
  return {
    ...actual,
    useSearchItems: () => mockSearchItemsState,
  };
});

describe('SearchScreen - auth loading', () => {
  beforeEach(() => {
    mockAuthState.user = undefined;
    mockAuthState.isAuthenticated = false;
    mockAuthState.session = undefined;
    mockAuthState.isLoading = true;
    mockSearchItemsState.data = undefined;
    mockSearchItemsState.isLoading = false;
  });

  it('shows centered loading while auth session is resolving', () => {
    renderWithProviders(<SearchScreen />);
    expect(screen.getByLabelText(commonEn.loading.a11y)).toBeTruthy();
  });
});

describe('SearchScreen - search results loading', () => {
  beforeEach(() => {
    mockAuthState.user = { id: 'u1' };
    mockAuthState.isAuthenticated = true;
    mockAuthState.session = {};
    mockAuthState.isLoading = false;
    mockSearchItemsState.data = undefined;
    mockSearchItemsState.isLoading = true;
  });

  it('shows loading in list area while search results are loading after submit', () => {
    renderWithProviders(<SearchScreen />);
    const input = screen.getByPlaceholderText(searchEn.searchPlaceholder);
    fireEvent.changeText(input, 'pedal');
    fireEvent(input, 'submitEditing');
    expect(screen.getAllByLabelText(commonEn.loading.a11y).length).toBeGreaterThanOrEqual(1);
  });
});

describe('SearchScreen - guest wall', () => {
  beforeEach(() => {
    mockAuthState.user = undefined;
    mockAuthState.isAuthenticated = false;
    mockAuthState.session = undefined;
    mockAuthState.isLoading = false;
    mockSearchItemsState.data = undefined;
    mockSearchItemsState.isLoading = false;
  });

  it('shows sign-in prompt when not authenticated', () => {
    renderWithProviders(<SearchScreen />);
    expect(screen.getByText(searchEn.authRequired.title)).toBeTruthy();
    expect(screen.getByText(searchEn.authRequired.signIn)).toBeTruthy();
  });
});

describe('SearchScreen - authenticated, no search yet', () => {
  beforeEach(() => {
    mockAuthState.user = { id: 'u1' };
    mockAuthState.isAuthenticated = true;
    mockAuthState.session = {};
    mockAuthState.isLoading = false;
    mockSearchItemsState.data = undefined;
    mockSearchItemsState.isLoading = false;
  });

  it('shows initial empty state prompt before any search', () => {
    renderWithProviders(<SearchScreen />);
    expect(screen.getByText(searchEn.empty.title)).toBeTruthy();
  });
});

describe('SearchScreen - search results', () => {
  const mockResult = createMockSearchResultItem({ id: 'item-r1' as ItemId, name: 'Test Pedal' });

  beforeEach(() => {
    mockAuthState.user = { id: 'u1' };
    mockAuthState.isAuthenticated = true;
    mockAuthState.session = {};
    mockAuthState.isLoading = false;
    mockSearchItemsState.data = [mockResult];
    mockSearchItemsState.isLoading = false;
  });

  it('shows hero result card after search submit', () => {
    renderWithProviders(<SearchScreen />);
    const input = screen.getByPlaceholderText(searchEn.searchPlaceholder);
    fireEvent.changeText(input, 'pedal');
    fireEvent(input, 'submitEditing');
    expect(screen.getByLabelText('Test Pedal')).toBeTruthy();
  });

  it('shows no-results empty state when results array is empty', () => {
    mockSearchItemsState.data = [];
    renderWithProviders(<SearchScreen />);
    const input = screen.getByPlaceholderText(searchEn.searchPlaceholder);
    fireEvent.changeText(input, 'pedal');
    fireEvent(input, 'submitEditing');
    expect(screen.getByText(searchEn.noResults.title)).toBeTruthy();
  });

  it('cycles sort label when sort control is pressed', () => {
    renderWithProviders(<SearchScreen />);
    const input = screen.getByPlaceholderText(searchEn.searchPlaceholder);
    fireEvent.changeText(input, 'pedal');
    fireEvent(input, 'submitEditing');
    expect(screen.getByText(searchEn.sort.distance)).toBeTruthy();
    fireEvent.press(screen.getByText(searchEn.sort.distance));
    expect(screen.getByText(searchEn.sort.newest)).toBeTruthy();
  });

  it('renders quick filter chips after search and toggles selection', () => {
    renderWithProviders(<SearchScreen />);
    const input = screen.getByPlaceholderText(searchEn.searchPlaceholder);
    fireEvent.changeText(input, 'pedal');
    fireEvent(input, 'submitEditing');
    const getBorrowChip = () => screen.getByRole('button', { name: searchEn.quickFilter.borrow });
    expect(getBorrowChip().props.accessibilityState?.selected).toBe(false);
    fireEvent.press(getBorrowChip());
    expect(getBorrowChip().props.accessibilityState?.selected).toBe(true);
    fireEvent.press(getBorrowChip());
    expect(getBorrowChip().props.accessibilityState?.selected).toBe(false);
  });
});
