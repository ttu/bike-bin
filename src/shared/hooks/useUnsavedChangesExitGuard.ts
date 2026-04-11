import { useCallback, useEffect, useRef } from 'react';
import { useNavigation } from 'expo-router';
import type { NavigationAction } from '@react-navigation/native';
import type { ConfirmConfig } from '@/shared/hooks/useConfirmDialog';

type UseUnsavedChangesExitGuardParams = {
  isDirty: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  openConfirm: (config: ConfirmConfig) => void;
  closeConfirm: () => void;
};

export type UseUnsavedChangesExitGuardResult = {
  /** Call immediately before programmatic navigation you intend to allow while `isDirty` is still true. */
  bypassNextNavigation: () => void;
};

/**
 * Blocks stack back / tab dismiss while `isDirty` is true and shows a confirm dialog.
 * Uses React Navigation `beforeRemove` (hardware back, header back, programmatic pop).
 */
export function useUnsavedChangesExitGuard({
  isDirty,
  title,
  message,
  confirmLabel,
  cancelLabel,
  openConfirm,
  closeConfirm,
}: UseUnsavedChangesExitGuardParams): UseUnsavedChangesExitGuardResult {
  const navigation = useNavigation();
  const isDirtyRef = useRef(isDirty);
  const pendingActionRef = useRef<NavigationAction | undefined>(undefined);
  const bypassNextRef = useRef(false);

  const bypassNextNavigation = useCallback(() => {
    bypassNextRef.current = true;
  }, []);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (bypassNextRef.current) {
        bypassNextRef.current = false;
        return;
      }
      if (!isDirtyRef.current) {
        return;
      }
      if (pendingActionRef.current) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      pendingActionRef.current = e.data.action;
      openConfirm({
        title,
        message,
        confirmLabel,
        cancelLabel,
        destructive: true,
        onConfirm: () => {
          const action = pendingActionRef.current;
          pendingActionRef.current = undefined;
          closeConfirm();
          if (action) {
            navigation.dispatch(action);
          }
        },
      });
    });
    return unsubscribe;
  }, [navigation, title, message, confirmLabel, cancelLabel, openConfirm, closeConfirm]);

  return { bypassNextNavigation };
}
