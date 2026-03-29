import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { tabScopedBack } from '../tabScopedBack';

jest.mock('expo-router', () => ({
  router: {
    canDismiss: jest.fn(),
    dismiss: jest.fn(),
    replace: jest.fn(),
  },
}));

const mockCanDismiss = router.canDismiss as jest.MockedFunction<typeof router.canDismiss>;
const mockDismiss = router.dismiss as jest.MockedFunction<typeof router.dismiss>;
const mockReplace = router.replace as jest.MockedFunction<typeof router.replace>;

describe('tabScopedBack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls dismiss(1) when canDismiss is true', () => {
    mockCanDismiss.mockReturnValue(true);
    const fallback = '/(tabs)/inventory' as Href;

    tabScopedBack(fallback);

    expect(mockDismiss).toHaveBeenCalledWith(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('calls replace(fallback) when canDismiss is false', () => {
    mockCanDismiss.mockReturnValue(false);
    const fallback = '/(tabs)/messages' as Href;

    tabScopedBack(fallback);

    expect(mockDismiss).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith(fallback);
  });
});
