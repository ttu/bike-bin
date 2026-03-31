import { useCallback, useState } from 'react';
import type { ConfirmDialogProps } from '@/shared/components';

/**
 * Configuration for opening a confirm dialog.
 * Matches the ConfirmDialogProps shape minus the state-managed fields.
 */
export type ConfirmConfig = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

/**
 * Return type of useConfirmDialog.
 */
export type UseConfirmDialogReturn = {
  /** The current confirm config, or `undefined` when the dialog is closed. */
  confirm: ConfirmConfig | undefined;
  /** Open the confirm dialog with the given config. */
  openConfirm: (config: ConfirmConfig) => void;
  /** Close the confirm dialog. */
  closeConfirm: () => void;
  /** Props to spread onto `<ConfirmDialog />`. */
  confirmDialogProps: Pick<
    ConfirmDialogProps,
    | 'visible'
    | 'title'
    | 'message'
    | 'confirmLabel'
    | 'cancelLabel'
    | 'destructive'
    | 'onDismiss'
    | 'onConfirm'
  >;
};

/**
 * Encapsulates the boilerplate for ConfirmDialog state management.
 *
 * Usage:
 * ```tsx
 * const { openConfirm, confirmDialogProps } = useConfirmDialog();
 *
 * const handleDelete = () => {
 *   openConfirm({
 *     title: t('confirm.delete.title'),
 *     message: t('confirm.delete.message'),
 *     confirmLabel: t('confirm.delete.confirm'),
 *     destructive: true,
 *     onConfirm: () => { deleteThing(); },
 *   });
 * };
 *
 * return (
 *   <>
 *     ...
 *     <ConfirmDialog {...confirmDialogProps} />
 *   </>
 * );
 * ```
 */
export function useConfirmDialog(): UseConfirmDialogReturn {
  const [confirm, setConfirm] = useState<ConfirmConfig | undefined>(undefined);

  const openConfirm = useCallback((config: ConfirmConfig) => {
    setConfirm(config);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirm(undefined);
  }, []);

  const confirmDialogProps: UseConfirmDialogReturn['confirmDialogProps'] = {
    visible: confirm !== undefined,
    title: confirm?.title ?? '',
    message: confirm?.message ?? '',
    confirmLabel: confirm?.confirmLabel ?? '',
    cancelLabel: confirm?.cancelLabel,
    destructive: confirm?.destructive,
    onDismiss: closeConfirm,
    onConfirm: () => confirm?.onConfirm(),
  };

  return { confirm, openConfirm, closeConfirm, confirmDialogProps };
}
