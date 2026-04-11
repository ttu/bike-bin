import { useEffect, useRef } from 'react';
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
}: UseUnsavedChangesExitGuardParams): void {
  const navigation = useNavigation();
  const isDirtyRef = useRef(isDirty);
  const pendingActionRef = useRef<NavigationAction | undefined>(undefined);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirtyRef.current) {
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
}
