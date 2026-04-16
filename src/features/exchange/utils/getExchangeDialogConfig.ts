import type { TFunction } from 'i18next';

export type ExchangeKind = 'donate' | 'sell';

export type ExchangeDialogConfig = {
  title: string;
  message: string;
  cancelLabel: string | undefined;
  confirmLabel: string;
};

export function getExchangeDialogConfig(
  kind: ExchangeKind | undefined,
  tExchange: TFunction<'exchange'>,
): ExchangeDialogConfig {
  if (!kind) {
    return { title: '', message: '', cancelLabel: undefined, confirmLabel: '' };
  }

  const prefix = kind === 'donate' ? 'confirm.donate' : 'confirm.sell';
  return {
    title: tExchange(`${prefix}.title`),
    message: tExchange(`${prefix}.message`),
    cancelLabel: tExchange(`${prefix}.cancel`),
    confirmLabel: tExchange(`${prefix}.confirm`),
  };
}
