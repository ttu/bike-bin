import { renderHook, act } from '@testing-library/react-native';
import { useUnsavedChangesExitGuard } from '../useUnsavedChangesExitGuard';

const mockAddListener = jest.fn();
const mockDispatch = jest.fn();
const mockNavigation = {
  addListener: mockAddListener,
  dispatch: mockDispatch,
};

jest.mock('expo-router', () => ({
  useNavigation: () => mockNavigation,
}));

describe('useUnsavedChangesExitGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not open a second confirm while a pending removal is already queued', () => {
    const openConfirm = jest.fn();
    const closeConfirm = jest.fn();
    let beforeRemove: ((e: { preventDefault: () => void; data: { action: unknown } }) => void) | undefined;

    mockAddListener.mockImplementation((event: string, handler: typeof beforeRemove) => {
      if (event === 'beforeRemove') {
        beforeRemove = handler;
      }
      return jest.fn();
    });

    renderHook(() =>
      useUnsavedChangesExitGuard({
        isDirty: true,
        title: 't',
        message: 'm',
        confirmLabel: 'd',
        cancelLabel: 'k',
        openConfirm,
        closeConfirm,
      }),
    );

    const e1 = {
      preventDefault: jest.fn(),
      data: { action: { type: 'GO_BACK' } },
    };
    const e2 = {
      preventDefault: jest.fn(),
      data: { action: { type: 'GO_BACK' } },
    };

    act(() => {
      beforeRemove?.(e1);
    });
    expect(openConfirm).toHaveBeenCalledTimes(1);

    act(() => {
      beforeRemove?.(e2);
    });
    expect(openConfirm).toHaveBeenCalledTimes(1);
    expect(e2.preventDefault).toHaveBeenCalled();
  });

  it('skips the guard once after bypassNextNavigation is invoked', () => {
    const openConfirm = jest.fn();
    const closeConfirm = jest.fn();
    let beforeRemove: ((e: { preventDefault: () => void; data: { action: unknown } }) => void) | undefined;

    mockAddListener.mockImplementation((event: string, handler: typeof beforeRemove) => {
      if (event === 'beforeRemove') {
        beforeRemove = handler;
      }
      return jest.fn();
    });

    const { result } = renderHook(() =>
      useUnsavedChangesExitGuard({
        isDirty: true,
        title: 't',
        message: 'm',
        confirmLabel: 'd',
        cancelLabel: 'k',
        openConfirm,
        closeConfirm,
      }),
    );

    act(() => {
      result.current.bypassNextNavigation();
    });

    const e = {
      preventDefault: jest.fn(),
      data: { action: { type: 'GO_BACK' } },
    };

    act(() => {
      beforeRemove?.(e);
    });

    expect(e.preventDefault).not.toHaveBeenCalled();
    expect(openConfirm).not.toHaveBeenCalled();

    act(() => {
      beforeRemove?.(e);
    });

    expect(openConfirm).toHaveBeenCalledTimes(1);
  });
});
