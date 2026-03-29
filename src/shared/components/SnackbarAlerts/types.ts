export type SnackbarAlertVariant = 'default' | 'success' | 'error';

export type ShowSnackbarAlertOptions = {
  message: string;
  variant?: SnackbarAlertVariant;
  duration?: 'short' | 'long';
  action?: { label: string; onPress: () => void };
};
