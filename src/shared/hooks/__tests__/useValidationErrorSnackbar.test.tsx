import { renderHook, act } from '@testing-library/react-native';
import { useValidationErrorSnackbar } from '../useValidationErrorSnackbar';

const mockShowSnackbarAlert = jest.fn();

jest.mock('@/shared/components/SnackbarAlerts', () => ({
  useSnackbarAlerts: () => ({ showSnackbarAlert: mockShowSnackbarAlert }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      (
        ({
          'formValidation.summaryIntro': 'Intro line',
          'formValidation.bulletPrefix': '• ',
        }) as Record<string, string>
      )[key] ?? key,
  }),
}));

describe('useValidationErrorSnackbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows an error snackbar with formatted body for multiple messages', () => {
    const { result } = renderHook(() => useValidationErrorSnackbar());

    act(() => {
      result.current(['First issue', 'Second issue']);
    });

    expect(mockShowSnackbarAlert).toHaveBeenCalledWith({
      message: 'Intro line\n\n• First issue\n• Second issue',
      variant: 'error',
      duration: 'long',
    });
  });

  it('does not call showSnackbarAlert when there are no messages after trim', () => {
    const { result } = renderHook(() => useValidationErrorSnackbar());

    act(() => {
      result.current(['', '   ']);
    });

    expect(mockShowSnackbarAlert).not.toHaveBeenCalled();
  });

  it('shows a single validation line without intro or bullets', () => {
    const { result } = renderHook(() => useValidationErrorSnackbar());

    act(() => {
      result.current(['Only one']);
    });

    expect(mockShowSnackbarAlert).toHaveBeenCalledWith({
      message: 'Only one',
      variant: 'error',
      duration: 'long',
    });
  });
});
