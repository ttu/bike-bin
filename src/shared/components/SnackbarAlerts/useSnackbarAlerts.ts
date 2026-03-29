import { useContext } from 'react';
import { SnackbarAlertsContext } from './context';

export function useSnackbarAlerts() {
  const ctx = useContext(SnackbarAlertsContext);
  if (ctx === undefined) {
    throw new Error('useSnackbarAlerts must be used within SnackbarAlertsProvider');
  }
  return ctx;
}
