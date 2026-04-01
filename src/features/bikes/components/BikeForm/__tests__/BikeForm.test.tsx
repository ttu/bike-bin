import { renderWithProviders } from '@/test/utils';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { BikeType, ItemCondition } from '@/shared/types';

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
    expect(getByText('Distance (km)')).toBeTruthy();
    expect(getByText('Usage hours')).toBeTruthy();
    expect(getByText('Condition')).toBeTruthy();
    expect(getByText('Notes')).toBeTruthy();
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

  it('shows error for invalid distance', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<BikeForm {...defaultProps} />);

    fireEvent.changeText(getByPlaceholderText('e.g. My Road Bike'), 'X');
    fireEvent.press(getByText('Gravel'));
    fireEvent.changeText(getByPlaceholderText('e.g. 3200'), 'not-a-number');
    fireEvent.press(getByText('Save Bike'));

    await waitFor(() => {
      expect(getByText('Enter a valid distance in kilometers')).toBeTruthy();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('selects a suggested brand from the autocomplete list', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<BikeForm {...defaultProps} />);

    fireEvent.changeText(getByPlaceholderText('e.g. My Road Bike'), 'My Bike');
    fireEvent.press(getByText('Road'));
    fireEvent.changeText(getByPlaceholderText('e.g. Canyon'), 'Tre');
    expect(getByText('Trek')).toBeTruthy();
    fireEvent.press(getByText('Trek'));

    fireEvent.press(getByText('Save Bike'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: 'Trek',
        }),
      );
    });
  });

  it('calls onSave with form data when valid', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<BikeForm {...defaultProps} />);

    fireEvent.changeText(getByPlaceholderText('e.g. My Road Bike'), 'Canyon Grail');
    fireEvent.press(getByText('Gravel'));
    fireEvent.changeText(getByPlaceholderText('e.g. Canyon'), 'Canyon');
    fireEvent.changeText(getByPlaceholderText('e.g. Endurace CF 7'), 'Grail');
    fireEvent.changeText(getByPlaceholderText('e.g. 2024'), '2024');
    fireEvent.changeText(getByPlaceholderText('e.g. 3200'), '1500');
    fireEvent.changeText(getByPlaceholderText('e.g. 120'), '50');
    fireEvent.press(getByText('Worn'));
    fireEvent.changeText(getByPlaceholderText('Service history, setup notes, etc.'), 'Tubeless');

    fireEvent.press(getByText('Save Bike'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        name: 'Canyon Grail',
        brand: 'Canyon',
        model: 'Grail',
        type: BikeType.Gravel,
        year: 2024,
        distanceKm: 1500,
        usageHours: 50,
        condition: ItemCondition.Worn,
        notes: 'Tubeless',
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
      distanceKm: 2000,
      usageHours: 15.5,
      condition: ItemCondition.New,
      notes: 'Stock tires',
    };
    const { getByDisplayValue } = renderWithProviders(
      <BikeForm {...defaultProps} initialData={initialData} />,
    );
    expect(getByDisplayValue('My Road Bike')).toBeTruthy();
    expect(getByDisplayValue('Canyon')).toBeTruthy();
    expect(getByDisplayValue('Endurace')).toBeTruthy();
    expect(getByDisplayValue('2023')).toBeTruthy();
    expect(getByDisplayValue('2000')).toBeTruthy();
    expect(getByDisplayValue('15.5')).toBeTruthy();
    expect(getByDisplayValue('Stock tires')).toBeTruthy();
  });

  it('shows delete button when onDelete provided', () => {
    const onDelete = jest.fn();
    const { getByText } = renderWithProviders(<BikeForm {...defaultProps} onDelete={onDelete} />);
    expect(getByText('Delete Bike')).toBeTruthy();
    fireEvent.press(getByText('Delete Bike'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('uses update label in edit mode', () => {
    const { getByText, queryByText } = renderWithProviders(
      <BikeForm {...defaultProps} isEditMode />,
    );
    expect(getByText('Update Bike')).toBeTruthy();
    expect(queryByText('Save Bike')).toBeNull();
  });

  it('does not show delete button without onDelete', () => {
    const { queryByText } = renderWithProviders(<BikeForm {...defaultProps} />);
    expect(queryByText('Delete Bike')).toBeNull();
  });
});
