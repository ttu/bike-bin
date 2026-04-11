import React from 'react';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { encodeReturnPath } from '@/shared/utils/returnPath';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { AvailabilityType, ItemCategory, ItemCondition, TransactionType } from '@/shared/types';
import type { RatingId, UserId, ItemId } from '@/shared/types';
import type { PublicProfile, PublicListing } from '@/features/profile/types';
import type { RatingWithReviewer } from '@/features/ratings/types';
import commonEn from '@/i18n/en/common.json';
import profileEn from '@/i18n/en/profile.json';
import PublicUserProfileScreen from '../[userId]';

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();

const mockProfileRouteParams: { userId: string; returnPath?: string } = {
  userId: 'public-user-1',
  returnPath: undefined,
};

const mockShowSnackbarAlert = jest.fn();
jest.mock('@/shared/components/SnackbarAlerts', () => {
  const actual = jest.requireActual<typeof import('@/shared/components/SnackbarAlerts')>(
    '@/shared/components/SnackbarAlerts',
  );
  return {
    ...actual,
    useSnackbarAlerts: () => ({ showSnackbarAlert: mockShowSnackbarAlert }),
  };
});

const mockReportMutate = jest.fn(
  (_vars: unknown, opts?: { onSuccess?: () => void; onError?: () => void }) => {
    opts?.onSuccess?.();
  },
);

jest.mock('@/shared/hooks/useReport', () => ({
  useReport: () => ({ mutate: mockReportMutate, isPending: false }),
}));

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

const mockPublicProfileQuery = {
  data: undefined as PublicProfile | undefined,
  isLoading: true,
  isError: false,
  isFetching: false,
  refetch: jest.fn(),
};

const mockPublicListingsQuery = {
  data: undefined as PublicListing[] | undefined,
  isLoading: false,
};

const mockRatingsQuery = {
  data: undefined as RatingWithReviewer[] | undefined,
  isLoading: false,
};

jest.mock('@/features/profile', () => ({
  usePublicProfile: () => ({
    data: mockPublicProfileQuery.data,
    isLoading: mockPublicProfileQuery.isLoading,
    isError: mockPublicProfileQuery.isError,
    isFetching: mockPublicProfileQuery.isFetching,
    refetch: mockPublicProfileQuery.refetch,
  }),
  usePublicListings: () => ({
    data: mockPublicListingsQuery.data,
    isLoading: mockPublicListingsQuery.isLoading,
  }),
}));

jest.mock('@/features/ratings/hooks/useUserRatings', () => ({
  useUserRatings: () => ({
    data: mockRatingsQuery.data,
    isLoading: mockRatingsQuery.isLoading,
  }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockProfileRouteParams,
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
  return {
    useSafeAreaInsets: () => mockInsets,
    SafeAreaProvider: View,
    SafeAreaView: View,
    SafeAreaInsetsContext: React.createContext(mockInsets),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: mockInsets,
    },
  };
});

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'reporter-1' },
    isAuthenticated: true,
    session: null,
    isLoading: false,
  }),
}));

const sampleProfile: PublicProfile = {
  id: 'public-user-1' as UserId,
  displayName: 'Public User',
  avatarUrl: undefined,
  ratingAvg: 4.25,
  ratingCount: 2,
  createdAt: '2026-01-01T00:00:00Z',
};

const sampleListing: PublicListing = {
  id: 'listing-1' as ItemId,
  name: 'Chain',
  category: ItemCategory.Component,
  condition: ItemCondition.Good,
  availabilityTypes: [AvailabilityType.Borrowable],
  price: undefined,
  createdAt: '2026-01-02T00:00:00Z',
};

const sampleRating: RatingWithReviewer = {
  id: 'r1' as RatingId,
  fromUserId: 'rev-1' as UserId,
  toUserId: 'public-user-1' as UserId,
  itemId: undefined,
  transactionType: TransactionType.Borrow,
  score: 5,
  text: 'Great',
  editableUntil: undefined,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  reviewer: { displayName: 'Reviewer', avatarUrl: undefined },
};

describe('PublicUserProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfileRouteParams.userId = 'public-user-1';
    mockProfileRouteParams.returnPath = undefined;
    mockPublicProfileQuery.data = undefined;
    mockPublicProfileQuery.isLoading = true;
    mockPublicProfileQuery.isError = false;
    mockPublicProfileQuery.isFetching = false;
    mockPublicListingsQuery.data = [];
    mockPublicListingsQuery.isLoading = false;
    mockRatingsQuery.data = [];
    mockRatingsQuery.isLoading = false;
    mockReportMutate.mockImplementation((_v, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
  });

  it('shows loading state while profile is loading', () => {
    renderWithProviders(<PublicUserProfileScreen />);
    expect(screen.getByLabelText(commonEn.loading.a11y)).toBeTruthy();
    expect(screen.queryByText('Public User')).toBeNull();
    expect(screen.queryByText(profileEn.publicProfile.notFoundTitle)).toBeNull();
  });

  it('shows not found state and refetches on retry', () => {
    mockPublicProfileQuery.isLoading = false;
    mockPublicProfileQuery.isError = true;
    mockPublicProfileQuery.data = undefined;
    renderWithProviders(<PublicUserProfileScreen />);
    expect(screen.getByText(profileEn.publicProfile.notFoundTitle)).toBeTruthy();
    fireEvent.press(screen.getByText(profileEn.publicProfile.retry));
    expect(mockPublicProfileQuery.refetch).toHaveBeenCalled();
  });

  it('navigates back via tabScopedBack when returnPath is absent', () => {
    mockPublicProfileQuery.isLoading = false;
    mockPublicProfileQuery.isError = false;
    mockPublicProfileQuery.data = sampleProfile;
    mockRatingsQuery.isLoading = true;
    renderWithProviders(<PublicUserProfileScreen />);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(jest.mocked(tabScopedBack)).toHaveBeenCalledWith('/(tabs)/profile');
  });

  it('replaces route when returnPath is a safe tab path', () => {
    mockProfileRouteParams.returnPath = encodeReturnPath('/(tabs)/search');
    mockPublicProfileQuery.isLoading = false;
    mockPublicProfileQuery.data = sampleProfile;
    mockRatingsQuery.isLoading = false;
    mockRatingsQuery.data = [];
    mockPublicListingsQuery.data = [];
    renderWithProviders(<PublicUserProfileScreen />);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)/search');
  });

  it('renders profile, listings, reviews, opens listing detail, and submits report', async () => {
    mockPublicProfileQuery.isLoading = false;
    mockPublicProfileQuery.data = sampleProfile;
    mockRatingsQuery.isLoading = false;
    mockRatingsQuery.data = [sampleRating];
    mockPublicListingsQuery.data = [sampleListing];

    renderWithProviders(<PublicUserProfileScreen />);

    expect(screen.getByText('Public User')).toBeTruthy();
    expect(screen.getByText('Chain')).toBeTruthy();

    fireEvent.press(screen.getByText('Chain'));
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/search/[id]',
      params: {
        id: 'listing-1',
        returnPath: encodeReturnPath('/(tabs)/profile/public-user-1'),
      },
    });

    fireEvent.press(screen.getByLabelText('Report'));
    await waitFor(() => {
      expect(screen.getByText(profileEn.report.title)).toBeTruthy();
    });
    fireEvent.press(screen.getByText(profileEn.report.reasons.inappropriate));
    fireEvent.press(screen.getByTestId('submit-report-button'));
    await waitFor(() => {
      expect(mockReportMutate).toHaveBeenCalled();
      expect(mockShowSnackbarAlert).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'success' }),
      );
    });
  });
});
