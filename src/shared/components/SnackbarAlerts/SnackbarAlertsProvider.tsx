import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Portal, Snackbar, Text, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';
import { SnackbarAlertsContext } from './context';
import type { ShowSnackbarAlertOptions, SnackbarAlertVariant } from './types';

type SnackbarState = {
  visible: boolean;
  message: string;
  variant: SnackbarAlertVariant;
  durationMs: number;
  action?: { label: string; onPress: () => void };
};

const initialState: SnackbarState = {
  visible: false,
  message: '',
  variant: 'default',
  durationMs: Snackbar.DURATION_MEDIUM,
};

export function SnackbarAlertsProvider({ children }: { children: ReactNode }) {
  const theme = useTheme<AppTheme>();
  const [state, setState] = useState<SnackbarState>(initialState);

  const dismiss = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const showSnackbarAlert = useCallback((options: ShowSnackbarAlertOptions) => {
    const durationMs =
      options.duration === 'long' ? Snackbar.DURATION_LONG : Snackbar.DURATION_SHORT;

    setState({
      visible: true,
      message: options.message,
      variant: options.variant ?? 'default',
      durationMs,
      action: options.action,
    });
  }, []);

  const value = useMemo(() => ({ showSnackbarAlert }), [showSnackbarAlert]);

  const { backgroundColor, textColor } = snackbarColors(theme, state.variant);

  const snackbarAction = state.action
    ? {
        label: state.action.label,
        onPress: () => {
          state.action?.onPress();
          dismiss();
        },
      }
    : undefined;

  return (
    <SnackbarAlertsContext.Provider value={value}>
      {children}
      <Portal>
        <Snackbar
          visible={state.visible}
          onDismiss={dismiss}
          duration={state.durationMs}
          action={snackbarAction}
          style={{ backgroundColor }}
        >
          <Text variant="bodyMedium" style={{ color: textColor }}>
            {state.message}
          </Text>
        </Snackbar>
      </Portal>
    </SnackbarAlertsContext.Provider>
  );
}

function snackbarColors(theme: AppTheme, variant: SnackbarAlertVariant) {
  switch (variant) {
    case 'error':
      return {
        backgroundColor: theme.colors.errorContainer,
        textColor: theme.colors.onErrorContainer,
      };
    case 'success':
      return {
        backgroundColor: theme.colors.primaryContainer,
        textColor: theme.colors.onPrimaryContainer,
      };
    default:
      return {
        backgroundColor: theme.colors.inverseSurface,
        textColor: theme.colors.inverseOnSurface,
      };
  }
}
