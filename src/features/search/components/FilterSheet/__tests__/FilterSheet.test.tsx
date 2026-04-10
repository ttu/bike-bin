import { renderWithProviders } from '@/test/utils';
import { fireEvent } from '@testing-library/react-native';
import { FilterSheet } from '../FilterSheet';
import type { ItemCategory, AvailabilityType } from '@/shared/types';
import { DEFAULT_SEARCH_FILTERS } from '../../../types';

function createDefaultProps() {
  return {
    filters: { ...DEFAULT_SEARCH_FILTERS },
    onFiltersChange: jest.fn(),
    onReset: jest.fn(),
    onApply: jest.fn(),
  };
}

describe('FilterSheet', () => {
  it('renders filter title and section labels', () => {
    const props = createDefaultProps();
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    expect(getByText('Filters')).toBeTruthy();
    expect(getByText('Category')).toBeTruthy();
    expect(getByText('Condition')).toBeTruthy();
    expect(getByText('Offer type')).toBeTruthy();
  });

  it('renders category chips', () => {
    const props = createDefaultProps();
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    expect(getByText('Component')).toBeTruthy();
    expect(getByText('Tool')).toBeTruthy();
    expect(getByText('Accessory')).toBeTruthy();
    expect(getByText('Bike')).toBeTruthy();
  });

  it('renders condition chips', () => {
    const props = createDefaultProps();
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    expect(getByText('New')).toBeTruthy();
    expect(getByText('Good')).toBeTruthy();
    expect(getByText('Worn')).toBeTruthy();
    expect(getByText('Broken')).toBeTruthy();
  });

  it('renders offer type chips', () => {
    const props = createDefaultProps();
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    expect(getByText('Borrow')).toBeTruthy();
    expect(getByText('Donate')).toBeTruthy();
    expect(getByText('Sell')).toBeTruthy();
  });

  it('calls onFiltersChange when category chip pressed', () => {
    const props = createDefaultProps();
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    fireEvent.press(getByText('Component'));
    expect(props.onFiltersChange).toHaveBeenCalledWith({ categories: ['component'] });
  });

  it('calls onFiltersChange when condition chip pressed', () => {
    const props = createDefaultProps();
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    fireEvent.press(getByText('New'));
    expect(props.onFiltersChange).toHaveBeenCalledWith({ conditions: ['new'] });
  });

  it('calls onFiltersChange when offer type chip pressed', () => {
    const props = createDefaultProps();
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    fireEvent.press(getByText('Borrow'));
    expect(props.onFiltersChange).toHaveBeenCalledWith({ offerTypes: ['borrowable'] });
  });

  it('shows price range when sellable is in offerTypes', () => {
    const props = createDefaultProps();
    props.filters.offerTypes = ['sellable'] as AvailabilityType[];
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    expect(getByText('Price range')).toBeTruthy();
    expect(getByText('Min')).toBeTruthy();
    expect(getByText('Max')).toBeTruthy();
  });

  it('hides price range when sellable is not in offerTypes', () => {
    const props = createDefaultProps();
    props.filters.offerTypes = ['borrowable'] as AvailabilityType[];
    const { queryByText } = renderWithProviders(<FilterSheet {...props} />);
    expect(queryByText('Price range')).toBeNull();
  });

  it('calls onFiltersChange with parsed price min when min input changes', () => {
    const props = createDefaultProps();
    props.filters.offerTypes = ['sellable'] as AvailabilityType[];
    const { getAllByPlaceholderText } = renderWithProviders(<FilterSheet {...props} />);
    const [minInput] = getAllByPlaceholderText('\u2014');
    fireEvent.changeText(minInput, '10.5');
    expect(props.onFiltersChange).toHaveBeenCalledWith({ priceMin: 10.5 });
  });

  it('calls onFiltersChange with undefined price min when min input is not a number', () => {
    const props = createDefaultProps();
    props.filters.offerTypes = ['sellable'] as AvailabilityType[];
    const { getAllByPlaceholderText } = renderWithProviders(<FilterSheet {...props} />);
    const [minInput] = getAllByPlaceholderText('\u2014');
    fireEvent.changeText(minInput, 'not-a-number');
    expect(props.onFiltersChange).toHaveBeenCalledWith({ priceMin: undefined });
  });

  it('calls onFiltersChange with parsed price max when max input changes', () => {
    const props = createDefaultProps();
    props.filters.offerTypes = ['sellable'] as AvailabilityType[];
    const { getAllByPlaceholderText } = renderWithProviders(<FilterSheet {...props} />);
    const [, maxInput] = getAllByPlaceholderText('\u2014');
    fireEvent.changeText(maxInput, '99');
    expect(props.onFiltersChange).toHaveBeenCalledWith({ priceMax: 99 });
  });

  it('calls onFiltersChange with undefined price max when max input is not a number', () => {
    const props = createDefaultProps();
    props.filters.offerTypes = ['sellable'] as AvailabilityType[];
    const { getAllByPlaceholderText } = renderWithProviders(<FilterSheet {...props} />);
    const [, maxInput] = getAllByPlaceholderText('\u2014');
    fireEvent.changeText(maxInput, '');
    expect(props.onFiltersChange).toHaveBeenCalledWith({ priceMax: undefined });
  });

  it('calls onReset when reset button pressed', () => {
    const props = createDefaultProps();
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    fireEvent.press(getByText('Reset'));
    expect(props.onReset).toHaveBeenCalled();
  });

  it('calls onApply when show results button pressed', () => {
    const props = createDefaultProps();
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    fireEvent.press(getByText('Show results'));
    expect(props.onApply).toHaveBeenCalled();
  });

  it('removes category when already selected', () => {
    const props = createDefaultProps();
    props.filters.categories = ['component'] as ItemCategory[];
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    fireEvent.press(getByText('Component'));
    expect(props.onFiltersChange).toHaveBeenCalledWith({ categories: [] });
  });
});
