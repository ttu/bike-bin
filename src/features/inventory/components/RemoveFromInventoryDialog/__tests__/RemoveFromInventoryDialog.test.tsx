import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { RemoveFromInventoryDialog } from '../RemoveFromInventoryDialog';

describe('RemoveFromInventoryDialog', () => {
  it('invokes onArchive and does not call onDelete when Archive is pressed', () => {
    const onDismiss = jest.fn();
    const onArchive = jest.fn();
    const onDelete = jest.fn();

    const { getByTestId } = renderWithProviders(
      <RemoveFromInventoryDialog
        visible
        onDismiss={onDismiss}
        onArchive={onArchive}
        onDelete={onDelete}
      />,
    );

    fireEvent.press(getByTestId('remove-inventory-archive'));

    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('invokes onDelete when Delete is pressed', () => {
    const onDelete = jest.fn();

    const { getByTestId } = renderWithProviders(
      <RemoveFromInventoryDialog
        visible
        onDismiss={jest.fn()}
        onArchive={jest.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.press(getByTestId('remove-inventory-delete'));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('invokes onDismiss when Cancel is pressed', () => {
    const onDismiss = jest.fn();

    const { getByTestId } = renderWithProviders(
      <RemoveFromInventoryDialog
        visible
        onDismiss={onDismiss}
        onArchive={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('remove-inventory-cancel'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('hides archive when onArchive is omitted', () => {
    const { queryByTestId } = renderWithProviders(
      <RemoveFromInventoryDialog visible onDismiss={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(queryByTestId('remove-inventory-archive')).toBeNull();
    expect(queryByTestId('remove-inventory-delete')).toBeTruthy();
  });
});
