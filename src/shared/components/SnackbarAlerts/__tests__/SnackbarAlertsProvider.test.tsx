import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { Button } from 'react-native-paper';
import { renderWithProviders } from '@/test/utils';
import { useSnackbarAlerts } from '../useSnackbarAlerts';

function Trigger({ message }: { message: string }) {
  const { showSnackbarAlert } = useSnackbarAlerts();
  return (
    <Button onPress={() => showSnackbarAlert({ message })} accessibilityLabel="Show snackbar">
      Show
    </Button>
  );
}

describe('SnackbarAlertsProvider', () => {
  it('shows snackbar text when showSnackbarAlert is called', async () => {
    renderWithProviders(<Trigger message="Operation saved" />);

    fireEvent.press(screen.getByLabelText('Show snackbar'));

    expect(await screen.findByText('Operation saved')).toBeTruthy();
  });
});
