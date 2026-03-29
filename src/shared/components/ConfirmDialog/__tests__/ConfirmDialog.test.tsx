import { fireEvent } from '@testing-library/react-native';
import { ConfirmDialog } from '../ConfirmDialog';
import { renderWithProviders } from '@/test/utils';

describe('ConfirmDialog', () => {
  const defaultProps = {
    visible: true,
    title: 'Test title',
    message: 'Test message body',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onDismiss: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title, message, and actions when visible', () => {
    const { getByText, getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);

    expect(getByText('Test title')).toBeTruthy();
    expect(getByText('Test message body')).toBeTruthy();
    expect(getByTestId('confirm-dialog-cancel')).toBeTruthy();
    expect(getByTestId('confirm-dialog-confirm')).toBeTruthy();
  });

  it('calls onDismiss when cancel is pressed', () => {
    const onDismiss = jest.fn();
    const { getByTestId } = renderWithProviders(
      <ConfirmDialog {...defaultProps} onDismiss={onDismiss} />,
    );

    fireEvent.press(getByTestId('confirm-dialog-cancel'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm is pressed', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = renderWithProviders(
      <ConfirmDialog {...defaultProps} onConfirm={onConfirm} />,
    );

    fireEvent.press(getByTestId('confirm-dialog-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('acknowledge variant shows only confirm action', () => {
    const { getByTestId, queryByTestId } = renderWithProviders(
      <ConfirmDialog {...defaultProps} variant="acknowledge" />,
    );

    expect(queryByTestId('confirm-dialog-cancel')).toBeNull();
    expect(getByTestId('confirm-dialog-confirm')).toBeTruthy();
  });

  it('uses default cancel label from common namespace when cancelLabel omitted', () => {
    const { getByText } = renderWithProviders(
      <ConfirmDialog {...defaultProps} cancelLabel={undefined} />,
    );

    expect(getByText('Cancel')).toBeTruthy();
  });
});
