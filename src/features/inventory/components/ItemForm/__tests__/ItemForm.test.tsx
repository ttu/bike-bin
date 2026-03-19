import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import { ItemForm } from '../ItemForm';

jest.mock('@/features/groups', () => ({
  useGroups: () => ({ data: [], isLoading: false }),
}));

describe('ItemForm', () => {
  const onSave = jest.fn();
  const defaultProps = { onSave, isSubmitting: false };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders required fields', () => {
    const { getByText } = renderWithProviders(<ItemForm {...defaultProps} />);
    expect(getByText('Name')).toBeTruthy();
    expect(getByText('Category')).toBeTruthy();
    expect(getByText('Condition')).toBeTruthy();
  });

  it('renders category chips as single-select', () => {
    const { getByText } = renderWithProviders(<ItemForm {...defaultProps} />);
    expect(getByText('Components')).toBeTruthy();
    expect(getByText('Tools')).toBeTruthy();
    expect(getByText('Accessories')).toBeTruthy();
  });

  it('renders condition chips as single-select', () => {
    const { getByText } = renderWithProviders(<ItemForm {...defaultProps} />);
    expect(getByText('New')).toBeTruthy();
    expect(getByText('Good')).toBeTruthy();
    expect(getByText('Worn')).toBeTruthy();
    expect(getByText('Broken')).toBeTruthy();
  });

  it('renders availability checkboxes', () => {
    const { getByText } = renderWithProviders(<ItemForm {...defaultProps} />);
    expect(getByText('Borrowable')).toBeTruthy();
    expect(getByText('Donatable')).toBeTruthy();
    expect(getByText('Sellable')).toBeTruthy();
    expect(getByText('Private')).toBeTruthy();
  });

  it('shows price input when Sellable is selected', () => {
    const { getByText, queryByText } = renderWithProviders(<ItemForm {...defaultProps} />);

    // Price should not be visible initially
    expect(queryByText('Price')).toBeNull();

    // Select Sellable
    fireEvent.press(getByText('Sellable'));
    expect(getByText('Price')).toBeTruthy();
  });

  it('shows deposit/duration when Borrowable is selected', () => {
    const { getByText, queryByText } = renderWithProviders(<ItemForm {...defaultProps} />);

    expect(queryByText('Deposit')).toBeNull();

    fireEvent.press(getByText('Borrowable'));
    expect(getByText('Deposit')).toBeTruthy();
    expect(getByText('Suggested duration')).toBeTruthy();
  });

  it('shows validation errors for missing required fields on submit', async () => {
    const { getByText } = renderWithProviders(<ItemForm {...defaultProps} />);

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(getByText('Name is required')).toBeTruthy();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with form data when valid', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<ItemForm {...defaultProps} />);

    // Fill required fields
    fireEvent.changeText(getByPlaceholderText('e.g. Shimano 105 Cassette'), 'My Cassette');
    fireEvent.press(getByText('Components'));
    fireEvent.press(getByText('Good'));

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Cassette',
          category: ItemCategory.Component,
          condition: ItemCondition.Good,
        }),
      );
    });
  });

  it('pre-fills form data in edit mode', () => {
    const initialData = {
      name: 'Existing Item',
      category: ItemCategory.Tool as ItemCategory,
      condition: ItemCondition.Worn as ItemCondition,
      availabilityTypes: [AvailabilityType.Borrowable] as AvailabilityType[],
    };

    const { getByDisplayValue } = renderWithProviders(
      <ItemForm {...defaultProps} initialData={initialData} />,
    );

    expect(getByDisplayValue('Existing Item')).toBeTruthy();
  });

  it('shows delete button in edit mode', () => {
    const onDelete = jest.fn();
    const { getByText } = renderWithProviders(
      <ItemForm
        {...defaultProps}
        initialData={{
          name: 'Test',
          category: ItemCategory.Tool,
          condition: ItemCondition.Good,
          availabilityTypes: [],
        }}
        onDelete={onDelete}
      />,
    );

    expect(getByText('Delete item')).toBeTruthy();
  });
});
