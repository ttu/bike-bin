import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import groupsEn from '@/i18n/en/groups.json';
import { GroupEditForm } from '../GroupEditForm';

const defaultProps = {
  initialName: 'Test Group',
  initialDescription: 'A description',
  initialIsPublic: true,
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

  it('shows validation error when name is only whitespace', () => {
    renderWithProviders(<GroupEditForm {...defaultProps} />);
    fireEvent.changeText(screen.getByDisplayValue('Test Group'), '   ');
    fireEvent.press(screen.getByText(groupsEn.edit.save));
    expect(screen.getByText(groupsEn.validation.nameRequired)).toBeTruthy();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed data with description', () => {
    renderWithProviders(<GroupEditForm {...defaultProps} />);
    fireEvent.changeText(screen.getByDisplayValue('Test Group'), ' Updated Name ');
    fireEvent.press(screen.getByText(groupsEn.edit.save));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      name: 'Updated Name',
      description: 'A description',
      isPublic: true,
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

  it('clears validation error on successful submit after previous error', () => {
    renderWithProviders(<GroupEditForm {...defaultProps} />);
    fireEvent.changeText(screen.getByDisplayValue('Test Group'), '');
    fireEvent.press(screen.getByText(groupsEn.edit.save));
    expect(screen.getByText(groupsEn.validation.nameRequired)).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText(groupsEn.create.namePlaceholder), 'Fixed');
    fireEvent.press(screen.getByText(groupsEn.edit.save));
    expect(screen.queryByText(groupsEn.validation.nameRequired)).toBeNull();
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Fixed' }));
  });
});
