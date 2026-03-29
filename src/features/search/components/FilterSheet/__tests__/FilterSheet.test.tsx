import { renderWithProviders } from '@/test/utils';
import { fireEvent } from '@testing-library/react-native';
import { FilterSheet } from '../FilterSheet';
import type { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';

function createDefaultProps() {
  return {
    categories: [] as ItemCategory[],
    onCategoriesChange: jest.fn(),
    conditions: [] as ItemCondition[],
    onConditionsChange: jest.fn(),
    offerTypes: [] as AvailabilityType[],
    onOfferTypesChange: jest.fn(),
    priceMin: undefined,
    priceMax: undefined,
    onPriceMinChange: jest.fn(),
    onPriceMaxChange: jest.fn(),
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

  it('calls onCategoriesChange when category chip pressed', () => {
    const props = createDefaultProps();
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    fireEvent.press(getByText('Component'));
    expect(props.onCategoriesChange).toHaveBeenCalledWith(['component']);
  });

  it('calls onConditionsChange when condition chip pressed', () => {
    const props = createDefaultProps();
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    fireEvent.press(getByText('New'));
    expect(props.onConditionsChange).toHaveBeenCalledWith(['new']);
  });

  it('calls onOfferTypesChange when offer type chip pressed', () => {
    const props = createDefaultProps();
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    fireEvent.press(getByText('Borrow'));
    expect(props.onOfferTypesChange).toHaveBeenCalledWith(['borrowable']);
  });

  it('shows price range when sellable is in offerTypes', () => {
    const props = createDefaultProps();
    props.offerTypes = ['sellable'] as AvailabilityType[];
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    expect(getByText('Price range')).toBeTruthy();
    expect(getByText('Min')).toBeTruthy();
    expect(getByText('Max')).toBeTruthy();
  });

  it('hides price range when sellable is not in offerTypes', () => {
    const props = createDefaultProps();
    props.offerTypes = ['borrowable'] as AvailabilityType[];
    const { queryByText } = renderWithProviders(<FilterSheet {...props} />);
    expect(queryByText('Price range')).toBeNull();
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
    props.categories = ['component'] as ItemCategory[];
    const { getByText } = renderWithProviders(<FilterSheet {...props} />);
    fireEvent.press(getByText('Component'));
    expect(props.onCategoriesChange).toHaveBeenCalledWith([]);
  });
});
