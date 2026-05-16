import { renderHook, act } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { useReviewerLongPress, REVIEWER_LONG_PRESS_MS } from './useReviewerLongPress';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

const selectionAsync = Haptics.selectionAsync as jest.Mock;

describe('useReviewerLongPress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes the 1500ms threshold', () => {
    const { result } = renderHook(() => useReviewerLongPress(jest.fn()));
    expect(result.current.delayLongPress).toBe(REVIEWER_LONG_PRESS_MS);
    expect(REVIEWER_LONG_PRESS_MS).toBe(1500);
  });

  it('fires haptic and trigger on long-press', () => {
    const onTriggered = jest.fn();
    const { result } = renderHook(() => useReviewerLongPress(onTriggered));
    act(() => result.current.onLongPress());
    expect(selectionAsync).toHaveBeenCalledTimes(1);
    expect(onTriggered).toHaveBeenCalledTimes(1);
  });
});
