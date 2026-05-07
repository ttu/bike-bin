import { renderHook } from '@testing-library/react-native';
import { useReportFeedbackMessages } from '../useReportFeedbackMessages';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('useReportFeedbackMessages', () => {
  it('returns translated success and error snackbar strings from the profile namespace', () => {
    const { result } = renderHook(() => useReportFeedbackMessages());

    expect(result.current).toEqual({
      success: 'report.successMessage',
      error: 'report.errorMessage',
    });
  });
});
