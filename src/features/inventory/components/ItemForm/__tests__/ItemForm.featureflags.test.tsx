import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { ItemCategory, AvailabilityType } from '@/shared/types';
import { ItemForm } from '../ItemForm';

// Marketplace disabled: the availability (sell/borrow/donate) section is hidden
// and items stay Private (the form default).
jest.mock('@/shared/utils/featureFlags', () => ({
  isMarketplaceEnabled: false,
  isGroupsEnabled: false,
}));

const buildSingleResult = () => ({ data: null, error: null });
const buildEqChain = () => ({ single: buildSingleResult });
const buildSelectChain = () => ({ eq: buildEqChain });
const buildFromChain = () => ({ select: buildSelectChain });

jest.mock('@/shared/api/supabase', () => ({
  supabase: { from: buildFromChain },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: null, signOut: jest.fn() }),
}));

jest.mock('@/features/groups', () => ({
  useGroups: () => ({ data: [], isLoading: false }),
}));

jest.mock('../../../hooks/useItems', () => ({
  useItems: () => ({ data: [], isLoading: false }),
}));

jest.mock('../../../hooks/useUserTags', () => ({
  useUserTags: () => ({ data: [], isLoading: false }),
}));

describe('ItemForm with marketplace disabled', () => {
  const onSave = jest.fn();
  const defaultProps = { onSave, isSubmitting: false };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hides the availability section (sell/borrow/donate)', () => {
    const { queryByText } = renderWithProviders(<ItemForm {...defaultProps} />);
    expect(queryByText('Borrow')).toBeNull();
    expect(queryByText('Donate')).toBeNull();
    expect(queryByText('Sell')).toBeNull();
  });

  it('still renders the core fields', () => {
    const { getByText } = renderWithProviders(<ItemForm {...defaultProps} />);
    expect(getByText('Name')).toBeTruthy();
    expect(getByText('Category')).toBeTruthy();
  });

  it('saves new items as Private by default', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<ItemForm {...defaultProps} />);

    fireEvent.changeText(getByPlaceholderText('e.g. Shimano 105 Cassette'), 'My Cassette');
    fireEvent.press(getByText('Components'));
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Cassette',
          category: ItemCategory.Component,
          availabilityTypes: [AvailabilityType.Private],
          visibility: 'private',
        }),
      );
    });
  });
});
