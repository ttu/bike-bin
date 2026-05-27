import { renderWithProviders } from '@/test/utils';
import { fireEvent } from '@testing-library/react-native';
import { CountryPicker } from '../CountryPicker';

describe('CountryPicker', () => {
  const onChange = jest.fn();

  beforeEach(() => {
    onChange.mockReset();
  });

  it('renders the selected country name', () => {
    const { getByText } = renderWithProviders(
      <CountryPicker value="fi" onChange={onChange} label="Country" />,
    );
    expect(getByText('Finland')).toBeTruthy();
  });

  it('opens the modal when the trigger is pressed', () => {
    const { getByText, queryByPlaceholderText } = renderWithProviders(
      <CountryPicker value="fi" onChange={onChange} label="Country" />,
    );
    expect(queryByPlaceholderText('Search countries')).toBeNull();
    fireEvent.press(getByText('Finland'));
    expect(queryByPlaceholderText('Search countries')).toBeTruthy();
  });

  it('filters the list by name search', () => {
    const { getByText, getByPlaceholderText, queryByText } = renderWithProviders(
      <CountryPicker value="fi" onChange={onChange} label="Country" />,
    );
    fireEvent.press(getByText('Finland'));
    fireEvent.changeText(getByPlaceholderText('Search countries'), 'united king');
    expect(queryByText('United Kingdom')).toBeTruthy();
    expect(queryByText('Finland')).toBeNull();
  });

  it('filters the list by alpha-2 code prefix', () => {
    const { getByText, getByPlaceholderText, queryByText } = renderWithProviders(
      <CountryPicker value="fi" onChange={onChange} label="Country" />,
    );
    fireEvent.press(getByText('Finland'));
    fireEvent.changeText(getByPlaceholderText('Search countries'), 'gb');
    expect(queryByText('United Kingdom')).toBeTruthy();
  });

  it('calls onChange with the selected alpha-2 code and closes the modal', () => {
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = renderWithProviders(
      <CountryPicker value="fi" onChange={onChange} label="Country" />,
    );
    fireEvent.press(getByText('Finland'));
    fireEvent.changeText(getByPlaceholderText('Search countries'), 'united king');
    fireEvent.press(getByText('United Kingdom'));
    expect(onChange).toHaveBeenCalledWith('gb');
    expect(queryByPlaceholderText('Search countries')).toBeNull();
  });
});
