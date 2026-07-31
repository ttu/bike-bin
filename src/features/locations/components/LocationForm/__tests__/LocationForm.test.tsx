import { renderWithProviders } from '@/test/utils';
import { fireEvent, waitFor } from '@testing-library/react-native';
import i18n from '@/shared/i18n/config';
import { LocationForm } from '../LocationForm';

const mockGeocodePostcode = jest.fn();

jest.mock('../../../utils/geocoding', () => ({
  geocodePostcode: (...args: unknown[]) => mockGeocodePostcode(...args),
  GeocodeError: class GeocodeError extends Error {},
}));

jest.mock('@/shared/utils/getDefaultCountry', () => ({
  getDefaultCountry: () => 'fi',
}));

describe('LocationForm', () => {
  const onSave = jest.fn();
  const onCancel = jest.fn();
  const defaultProps = { onSave, onCancel, isSubmitting: false };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders postcode and label inputs', () => {
    const { getByText } = renderWithProviders(<LocationForm {...defaultProps} />);
    expect(getByText('Postcode / ZIP')).toBeTruthy();
    expect(getByText('Label')).toBeTruthy();
  });

  it('renders save and cancel buttons', () => {
    const { getByText } = renderWithProviders(<LocationForm {...defaultProps} />);
    expect(getByText('Save')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('shows validation errors for empty fields on submit', async () => {
    const { getByText } = renderWithProviders(<LocationForm {...defaultProps} />);

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(getByText('Postcode is required')).toBeTruthy();
      expect(getByText('Label is required')).toBeTruthy();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is pressed', () => {
    const { getByText } = renderWithProviders(<LocationForm {...defaultProps} />);
    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows primary toggle by default', () => {
    const { getByText } = renderWithProviders(<LocationForm {...defaultProps} />);
    expect(getByText('Set as primary location')).toBeTruthy();
  });

  it('hides primary toggle when showPrimaryToggle is false', () => {
    const { queryByText } = renderWithProviders(
      <LocationForm {...defaultProps} showPrimaryToggle={false} />,
    );
    expect(queryByText('Set as primary location')).toBeNull();
  });

  it('populates initial data', () => {
    const { getByDisplayValue } = renderWithProviders(
      <LocationForm {...defaultProps} initialData={{ postcode: 'SW1A 1AA', label: 'Home' }} />,
    );
    expect(getByDisplayValue('SW1A 1AA')).toBeTruthy();
    expect(getByDisplayValue('Home')).toBeTruthy();
  });

  it('calls geocodePostcode on postcode blur', async () => {
    mockGeocodePostcode.mockResolvedValue({
      lat: 51.5,
      lng: -0.1,
      areaName: 'Westminster',
    });

    const { getByPlaceholderText } = renderWithProviders(<LocationForm {...defaultProps} />);

    const postcodeInput = getByPlaceholderText('Enter your postcode');
    fireEvent.changeText(postcodeInput, 'SW1A 1AA');
    fireEvent(postcodeInput, 'blur');

    await waitFor(() => {
      expect(mockGeocodePostcode).toHaveBeenCalledWith('SW1A 1AA', 'fi');
    });
  });

  it('shows geocode error when postcode lookup fails on blur', async () => {
    mockGeocodePostcode.mockRejectedValue(new Error('network'));

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LocationForm {...defaultProps} />,
    );

    const postcodeInput = getByPlaceholderText('Enter your postcode');
    fireEvent.changeText(postcodeInput, 'INVALID');
    fireEvent(postcodeInput, 'blur');

    await waitFor(() => {
      expect(getByText(i18n.t('errors.geocodeFailed', { ns: 'locations' }))).toBeTruthy();
    });
  });

  it('shows area preview after successful geocode', async () => {
    mockGeocodePostcode.mockResolvedValue({
      lat: 51.5,
      lng: -0.1,
      areaName: 'Westminster',
    });

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LocationForm {...defaultProps} />,
    );

    const postcodeInput = getByPlaceholderText('Enter your postcode');
    fireEvent.changeText(postcodeInput, 'SW1A 1AA');
    fireEvent(postcodeInput, 'blur');

    await waitFor(() => {
      expect(getByText('Area: Westminster')).toBeTruthy();
    });
  });

  it('calls onSave with geocoded data when form is valid', async () => {
    const geocodeResult = { lat: 51.5, lng: -0.1, areaName: 'Westminster' };
    mockGeocodePostcode.mockResolvedValue(geocodeResult);

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LocationForm {...defaultProps} />,
    );

    const postcodeInput = getByPlaceholderText('Enter your postcode');
    fireEvent.changeText(postcodeInput, 'SW1A 1AA');
    fireEvent(postcodeInput, 'blur');

    await waitFor(() => {
      expect(getByText('Area: Westminster')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('e.g. Home, Workshop'), 'Office');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        postcode: 'SW1A 1AA',
        label: 'Office',
        isPrimary: false,
        geocoded: geocodeResult,
      });
    });
  });

  it('defaults the country from getDefaultCountry', () => {
    const { getByText } = renderWithProviders(<LocationForm {...defaultProps} />);
    expect(getByText('Finland')).toBeTruthy();
  });

  it('passes country to geocodePostcode on postcode blur', async () => {
    mockGeocodePostcode.mockResolvedValue({ areaName: 'Helsinki', lat: 60.17, lng: 24.94 });
    const { getByPlaceholderText } = renderWithProviders(<LocationForm {...defaultProps} />);
    const input = getByPlaceholderText('Enter your postcode');
    fireEvent.changeText(input, '00100');
    fireEvent(input, 'blur');
    await waitFor(() => {
      expect(mockGeocodePostcode).toHaveBeenCalledWith('00100', 'fi');
    });
  });

  it('clears the area preview and re-geocodes when the country changes', async () => {
    mockGeocodePostcode.mockResolvedValueOnce({ areaName: 'Helsinki', lat: 60.17, lng: 24.94 });
    const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
      <LocationForm {...defaultProps} />,
    );

    const postcode = getByPlaceholderText('Enter your postcode');
    fireEvent.changeText(postcode, '00100');
    fireEvent(postcode, 'blur');
    await waitFor(() => expect(getByText('Area: Helsinki')).toBeTruthy());

    mockGeocodePostcode.mockResolvedValueOnce({ areaName: 'London', lat: 51.5, lng: -0.1 });
    fireEvent.press(getByText('Finland'));
    fireEvent.changeText(getByPlaceholderText('Search countries'), 'united king');
    fireEvent.press(getByText('United Kingdom'));

    expect(queryByText('Area: Helsinki')).toBeNull();

    await waitFor(() => {
      expect(mockGeocodePostcode).toHaveBeenLastCalledWith('00100', 'gb');
    });
    await waitFor(() => expect(getByText('Area: London')).toBeTruthy());
  });
});
