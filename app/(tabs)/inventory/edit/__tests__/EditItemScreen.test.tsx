import { screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithProviders } from '@/test/utils';
import { createMockItem } from '@/test/factories';
import { mockAuthModule } from '@/test/authMocks';
import {
  ItemStatus,
  ItemCategory,
  ItemCondition,
  AvailabilityType,
  Visibility,
} from '@/shared/types';
import type { ItemId } from '@/shared/types';
import EditItemScreen from '../[id]';

const mockDispatch = jest.fn();
let beforeRemoveHandler:
  | ((e: { preventDefault: () => void; data: { action: { type: string } } }) => void)
  | undefined;

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'item-123' }),
  useNavigation: () => ({
    addListener: jest.fn((event: string, handler: typeof beforeRemoveHandler) => {
      if (event === 'beforeRemove') {
        beforeRemoveHandler = handler;
      }
      return jest.fn();
    }),
    dispatch: mockDispatch,
  }),
  router: {
    push: jest.fn(),
    canDismiss: jest.fn(() => true),
    dismiss: jest.fn(),
    replace: jest.fn(),
  },
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

jest.mock('@/features/auth', () => mockAuthModule);

jest.mock('@/features/profile', () => {
  const actual = jest.requireActual<typeof import('@/features/profile')>('@/features/profile');
  return {
    ...actual,
    useDistanceUnit: () => ({
      distanceUnit: 'km' as const,
      setDistanceUnit: jest.fn(),
    }),
  };
});

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test/${path}` } }),
      }),
    },
  },
}));

const mockItem = createMockItem({
  id: 'item-123' as ItemId,
  name: 'Test Chain',
  category: ItemCategory.Component,
  subcategory: 'drivetrain',
  condition: ItemCondition.Good,
  status: ItemStatus.Stored,
  availabilityTypes: [AvailabilityType.Borrowable],
  visibility: Visibility.Private,
  tags: ['shimano', 'road', '11-speed'],
});

const mockMutateAsync = jest.fn();

jest.mock('@/features/inventory', () => ({
  ...jest.requireActual('@/features/inventory'),
  useItem: () => ({ data: mockItem, isLoading: false, isSuccess: true }),
  useItemPhotos: () => ({ data: [], isSuccess: true }),
  useUpdateItem: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useDeleteItem: () => ({ mutateAsync: jest.fn() }),
  usePhotoUpload: () => ({ pickAndUpload: jest.fn(), isUploading: false }),
  useUserTags: () => ({ data: ['shimano', 'road', '11-speed', 'mtb'] }),
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: jest.fn(),
    }),
  };
});

describe('EditItemScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue(undefined);
  });

  it('does not show inventory id label in the hero header', () => {
    renderWithProviders(<EditItemScreen />);

    expect(screen.queryByText(/Inventory ID:/)).toBeNull();
  });

  it('displays existing tags when editing an item', () => {
    renderWithProviders(<EditItemScreen />);

    // Tags are behind the "More details" expandable section
    fireEvent.press(screen.getByText('More details'));

    expect(screen.getByText('shimano')).toBeTruthy();
    expect(screen.getByText('road')).toBeTruthy();
    expect(screen.getByText('11-speed')).toBeTruthy();
  });

  it('includes saved subcategory in the payload when saving after an edit', () => {
    renderWithProviders(<EditItemScreen />);

    fireEvent.changeText(screen.getByDisplayValue('1'), '2');
    fireEvent.press(screen.getByText('Update Inventory'));

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'item-123',
        subcategory: 'drivetrain',
        quantity: 2,
      }),
    );
  });

  it('shows unsaved-changes confirmation when leaving while dirty; discard dispatches without saving', () => {
    renderWithProviders(<EditItemScreen />);

    fireEvent.changeText(screen.getByDisplayValue('1'), '2');

    const preventDefault = jest.fn();
    act(() => {
      beforeRemoveHandler?.({
        preventDefault,
        data: { action: { type: 'GO_BACK' } },
      });
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(screen.getByText('Discard changes?')).toBeTruthy();

    fireEvent.press(screen.getByTestId('confirm-dialog-confirm'));

    expect(mockMutateAsync).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
  });

  it('closes unsaved-changes confirmation when keeping editing', () => {
    renderWithProviders(<EditItemScreen />);

    fireEvent.changeText(screen.getByDisplayValue('1'), '2');

    act(() => {
      beforeRemoveHandler?.({
        preventDefault: jest.fn(),
        data: { action: { type: 'GO_BACK' } },
      });
    });

    fireEvent.press(screen.getByTestId('confirm-dialog-cancel'));

    expect(screen.queryByText('Discard changes?')).toBeNull();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('saves then dismisses after a successful update', async () => {
    renderWithProviders(<EditItemScreen />);

    fireEvent.changeText(screen.getByDisplayValue('1'), '3');
    fireEvent.press(screen.getByText('Update Inventory'));

    expect(mockMutateAsync).toHaveBeenCalled();
    await waitFor(() => {
      expect(router.dismiss).toHaveBeenCalledWith(1);
    });
  });
});
