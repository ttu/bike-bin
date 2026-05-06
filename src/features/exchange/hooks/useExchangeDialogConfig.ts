import { useTranslation } from 'react-i18next';

export type ExchangeKind = 'donate' | 'sell';

export type ExchangeDialogConfig = {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
};

/**
 * Returns the confirm-dialog labels (title/message/cancel/confirm) for marking
 * an item as donated or sold. Owns the `exchange` i18n namespace so callers
 * outside this feature don't need to import it.
 */
export function useExchangeDialogConfig(kind: ExchangeKind): ExchangeDialogConfig {
  const { t } = useTranslation('exchange');
  const prefix = kind === 'donate' ? 'confirm.donate' : 'confirm.sell';
  return {
    title: t(`${prefix}.title`),
    message: t(`${prefix}.message`),
    cancelLabel: t(`${prefix}.cancel`),
    confirmLabel: t(`${prefix}.confirm`),
  };
}
