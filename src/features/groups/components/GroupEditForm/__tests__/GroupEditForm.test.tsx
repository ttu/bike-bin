import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import groupsEn from '@/i18n/en/groups.json';

jest.mock('@/features/locations', () => ({
  geocodePostcode: jest.fn().mockResolvedValue({
    areaName: 'Berlin Mitte, Germany',
    lat: 52.5316,
    lng: 13.3888,
  }),
}));

import { GroupEditForm } from '../GroupEditForm';

const defaultProps = {
  initialName: 'Test Group',
  initialDescription: 'A description',
  initialIsPublic: true,
  initialPostcode: '10115',
  initialCountry: 'de',
  initialAreaName: 'Berlin Mitte, Germany',
  initialLatitude: 52.5316,
  initialLongitude: 13.3888,
  onCancel: jest.fn(),
  onSubmit: jest.fn(),
  isSubmitting: false,
};

describe('GroupEditForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial values', () => {
    renderWithProviders(<GroupEditForm {...defaultProps} />);
    expect(screen.getByDisplayValue('Test Group')).toBeTruthy();
    expect(screen.getByDisplayValue('A description')).toBeTruthy();
    expect(screen.getByDisplayValue('10115')).toBeTruthy();
    expect(screen.getByText(groupsEn.edit.title)).toBeTruthy();
  });

  it('calls onCancel when back is pressed', () => {
    renderWithProviders(<GroupEditForm {...defaultProps} />);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('shows validation error when name is empty', () => {
    renderWithProviders(<GroupEditForm {...defaultProps} />);
    fireEvent.changeText(screen.getByDisplayValue('Test Group'), '');
    fireEvent.press(screen.getByText(groupsEn.edit.save));
    expect(screen.getByText(groupsEn.validation.nameRequired)).toBeTruthy();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error when postcode is empty', () => {
    renderWithProviders(<GroupEditForm {...defaultProps} initialPostcode="" />);
    fireEvent.press(screen.getByText(groupsEn.edit.save));
    expect(screen.getByText(groupsEn.validation.postcodeRequired)).toBeTruthy();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed data with location', () => {
    renderWithProviders(<GroupEditForm {...defaultProps} />);
    fireEvent.changeText(screen.getByDisplayValue('Test Group'), ' Updated Name ');
    fireEvent.press(screen.getByText(groupsEn.edit.save));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      name: 'Updated Name',
      description: 'A description',
      isPublic: true,
      postcode: '10115',
      country: 'de',
      areaName: 'Berlin Mitte, Germany',
      latitude: 52.5316,
      longitude: 13.3888,
    });
  });

  it('submits undefined for empty description', () => {
    renderWithProviders(<GroupEditForm {...defaultProps} initialDescription="" />);
    fireEvent.press(screen.getByText(groupsEn.edit.save));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ description: undefined }),
    );
  });

  it('toggles public switch', () => {
    renderWithProviders(<GroupEditForm {...defaultProps} initialIsPublic={false} />);
    expect(screen.getByText(groupsEn.create.privateDescription)).toBeTruthy();
    fireEvent(screen.getByRole('switch'), 'valueChange', true);
    expect(screen.getByText(groupsEn.create.publicDescription)).toBeTruthy();
  });
});
