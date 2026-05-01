import type { TFunction } from 'i18next';

export type ExchangeKind = 'donate' | 'sell';

export type ExchangeDialogConfig = {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
};

export function getExchangeDialogConfig(
  kind: ExchangeKind,
  tExchange: TFunction<'exchange'>,
): ExchangeDialogConfig {
  const prefix = kind === 'donate' ? 'confirm.donate' : 'confirm.sell';
  return {
    title: tExchange(`${prefix}.title`),
    message: tExchange(`${prefix}.message`),
    cancelLabel: tExchange(`${prefix}.cancel`),
    confirmLabel: tExchange(`${prefix}.confirm`),
  };
}
