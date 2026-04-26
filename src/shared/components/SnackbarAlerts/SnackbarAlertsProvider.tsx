import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Snackbar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

/**
 * Vertical space above the home indicator so the snackbar clears the custom
 * absolute tab bar (`app/(tabs)/_layout.tsx` GlassTabBar: icons + labels + padding).
 * Without this, the bar sits on top of the snackbar and hides the message.
 */
const BOTTOM_TAB_BAR_CLEARANCE_DP = 56;

export function SnackbarAlertsProvider({ children }: { readonly children: ReactNode }) {
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
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

  /** Overrides Paper's wrapper padding so the toast sits above the tab bar, not under it. */
  const snackbarWrapperStyle = useMemo(
    () => [
      styles.snackbarAboveTabBar,
      { paddingBottom: insets.bottom + BOTTOM_TAB_BAR_CLEARANCE_DP },
    ],
    [insets.bottom],
  );

  return (
    <SnackbarAlertsContext.Provider value={value}>
      {children}
      <Portal>
        <Snackbar
          visible={state.visible}
          onDismiss={dismiss}
          duration={state.durationMs}
          action={snackbarAction}
          wrapperStyle={snackbarWrapperStyle}
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

const styles = StyleSheet.create({
  snackbarAboveTabBar: {
    zIndex: 10000,
    elevation: 24,
  },
});

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
