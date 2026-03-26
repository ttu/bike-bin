import { renderHook, act } from '@testing-library/react-native';

const mockRequestPermissions = jest.fn();
const mockLaunchImageLibrary = jest.fn();
const mockManipulate = jest.fn();

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: (...args: unknown[]) => mockRequestPermissions(...args),
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibrary(...args),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: (...args: unknown[]) => mockManipulate(...args),
  SaveFormat: { JPEG: 'jpeg' },
}));

import { usePhotoPicker } from '../usePhotoPicker';

describe('usePhotoPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns undefined when permission denied', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: false });

    const { result } = renderHook(() => usePhotoPicker());

    let picked: unknown;
    await act(async () => {
      picked = await result.current.pickPhoto();
    });

    expect(picked).toBeUndefined();
    expect(mockLaunchImageLibrary).not.toHaveBeenCalled();
  });

  it('returns undefined when user cancels picker', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchImageLibrary.mockResolvedValue({ canceled: true, assets: [] });

    const { result } = renderHook(() => usePhotoPicker());

    let picked: unknown;
    await act(async () => {
      picked = await result.current.pickPhoto();
    });

    expect(picked).toBeUndefined();
  });

  it('returns compressed photo on success', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchImageLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///original.jpg' }],
    });
    mockManipulate.mockResolvedValue({ uri: 'file:///compressed.jpg' });

    const { result } = renderHook(() => usePhotoPicker());

    let picked: { uri: string; fileName: string } | undefined;
    await act(async () => {
      picked = await result.current.pickPhoto();
    });

    expect(picked).toBeDefined();
    expect(picked!.uri).toBe('file:///compressed.jpg');
    expect(picked!.fileName).toMatch(/\.jpg$/);
    expect(mockManipulate).toHaveBeenCalledWith(
      'file:///original.jpg',
      [{ resize: { width: 1200 } }],
      expect.objectContaining({ compress: 0.7, format: 'jpeg' }),
    );
  });

  it('starts with isPicking false', () => {
    const { result } = renderHook(() => usePhotoPicker());
    expect(result.current.isPicking).toBe(false);
  });
});
