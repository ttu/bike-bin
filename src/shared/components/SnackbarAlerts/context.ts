import { createContext } from 'react';
import type { ShowSnackbarAlertOptions } from './types';

export type SnackbarAlertsContextValue = {
  showSnackbarAlert: (options: ShowSnackbarAlertOptions) => void;
};

export const SnackbarAlertsContext = createContext<SnackbarAlertsContextValue | undefined>(
  undefined,
);
