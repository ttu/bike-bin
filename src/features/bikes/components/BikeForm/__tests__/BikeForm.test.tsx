import { renderWithProviders } from '@/test/utils';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { BikeType } from '@/shared/types';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.com/${path}` } }),
      }),
    },
  },
}));

import { BikeForm } from '../BikeForm';

describe('BikeForm', () => {
  const onSave = jest.fn();
  const defaultProps = { onSave, isSubmitting: false };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields', () => {
    const { getByText } = renderWithProviders(<BikeForm {...defaultProps} />);
    expect(getByText('Bike Name')).toBeTruthy();
    expect(getByText('Type')).toBeTruthy();
    expect(getByText('Brand')).toBeTruthy();
    expect(getByText('Model')).toBeTruthy();
    expect(getByText('Year')).toBeTruthy();
  });

  it('renders bike type chips', () => {
    const { getByText } = renderWithProviders(<BikeForm {...defaultProps} />);
    expect(getByText('Road')).toBeTruthy();
    expect(getByText('Gravel')).toBeTruthy();
    expect(getByText('Mountain')).toBeTruthy();
    expect(getByText('City')).toBeTruthy();
  });

  it('shows validation errors for missing required fields', async () => {
    const { getByText } = renderWithProviders(<BikeForm {...defaultProps} />);

    fireEvent.press(getByText('Save Bike'));

    await waitFor(() => {
      expect(getByText('Bike name is required')).toBeTruthy();
      expect(getByText('Bike type is required')).toBeTruthy();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with form data when valid', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<BikeForm {...defaultProps} />);

    fireEvent.changeText(getByPlaceholderText('e.g. My Road Bike'), 'Canyon Grail');
    fireEvent.press(getByText('Gravel'));
    fireEvent.changeText(getByPlaceholderText('e.g. Canyon'), 'Canyon');
    fireEvent.changeText(getByPlaceholderText('e.g. Endurace CF 7'), 'Grail');
    fireEvent.changeText(getByPlaceholderText('e.g. 2024'), '2024');

    fireEvent.press(getByText('Save Bike'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        name: 'Canyon Grail',
        brand: 'Canyon',
        model: 'Grail',
        type: BikeType.Gravel,
        year: 2024,
      });
    });
  });

  it('pre-fills form in edit mode', () => {
    const initialData = {
      name: 'My Road Bike',
      brand: 'Canyon',
      model: 'Endurace',
      type: BikeType.Road,
      year: 2023,
    };
    const { getByDisplayValue } = renderWithProviders(
      <BikeForm {...defaultProps} initialData={initialData} />,
    );
    expect(getByDisplayValue('My Road Bike')).toBeTruthy();
    expect(getByDisplayValue('Canyon')).toBeTruthy();
    expect(getByDisplayValue('Endurace')).toBeTruthy();
    expect(getByDisplayValue('2023')).toBeTruthy();
  });

  it('shows delete button when onDelete provided', () => {
    const onDelete = jest.fn();
    const { getByText } = renderWithProviders(<BikeForm {...defaultProps} onDelete={onDelete} />);
    expect(getByText('Delete Bike')).toBeTruthy();
    fireEvent.press(getByText('Delete Bike'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('does not show delete button without onDelete', () => {
    const { queryByText } = renderWithProviders(<BikeForm {...defaultProps} />);
    expect(queryByText('Delete Bike')).toBeNull();
  });
});
