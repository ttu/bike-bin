import { renderHook } from '@testing-library/react-native';
import { useRequestBorrowDialogConfig } from '../useRequestBorrowDialogConfig';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) =>
      vars?.itemName !== undefined ? `${key}:${String(vars.itemName)}` : key,
  }),
}));

describe('useRequestBorrowDialogConfig', () => {
  it('returns translated dialog labels and an error message, interpolating itemName into the message', () => {
    const { result } = renderHook(() => useRequestBorrowDialogConfig('Bike pump'));

    expect(result.current).toEqual({
      title: 'confirm.requestBorrow.title',
      message: 'confirm.requestBorrow.message:Bike pump',
      cancelLabel: 'confirm.requestBorrow.cancel',
      confirmLabel: 'confirm.requestBorrow.confirm',
      errorMessage: 'error.requestFailed',
    });
  });
});
