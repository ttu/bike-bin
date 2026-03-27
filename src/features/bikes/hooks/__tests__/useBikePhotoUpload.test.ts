import { renderHook, act } from '@testing-library/react-native';
import type { BikeId } from '@/shared/types';

// Mock expo-image-picker
const mockRequestPermissions = jest.fn();
const mockLaunchLibrary = jest.fn();
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: () => mockRequestPermissions(),
  launchImageLibraryAsync: () => mockLaunchLibrary(),
}));

// Mock expo-image-manipulator
const mockManipulate = jest.fn();
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: (...args: unknown[]) => mockManipulate(...args),
  SaveFormat: { JPEG: 'jpeg' },
}));

// Mock supabase
const mockUpload = jest.fn();
const mockInsert = jest.fn();
const mockSelectEq = jest.fn();
const mockSelect = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({ upload: mockUpload })),
    },
    from: jest.fn((table: string) => {
      if (table === 'bike_photos') {
        return {
          select: mockSelect,
          insert: mockInsert,
        };
      }
      return {};
    }),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { id: 'user-123' }, isAuthenticated: true }),
}));

// Mock fetch for blob conversion
const mockBlob = { type: 'image/jpeg' };
global.fetch = jest.fn().mockResolvedValue({
  blob: () => Promise.resolve(mockBlob),
}) as jest.Mock;

import { useBikePhotoUpload } from '../useBikePhotoUpload';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';


describe('useBikePhotoUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns error when permission denied', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: false });

    const { result } = renderHook(() => useBikePhotoUpload(), { wrapper: createQueryClientHookWrapper() });

    let returnValue: string | undefined;
    await act(async () => {
      returnValue = await result.current.pickAndUpload('bike-1' as BikeId);
    });

    expect(returnValue).toBeUndefined();
    expect(result.current.error).toBe('Permission to access gallery was denied');
  });

  it('returns undefined when user cancels picker', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: [] });

    const { result } = renderHook(() => useBikePhotoUpload(), { wrapper: createQueryClientHookWrapper() });

    let returnValue: string | undefined;
    await act(async () => {
      returnValue = await result.current.pickAndUpload('bike-1' as BikeId);
    });

    expect(returnValue).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('uploads photo successfully', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    mockManipulate.mockResolvedValue({ uri: 'file:///compressed.jpg' });
    mockUpload.mockResolvedValue({ error: null });
    mockSelect.mockReturnValue({
      eq: mockSelectEq.mockResolvedValue({ data: [{ id: 'p1' }, { id: 'p2' }], error: null }),
    });
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useBikePhotoUpload(), { wrapper: createQueryClientHookWrapper() });

    let returnValue: string | undefined;
    await act(async () => {
      returnValue = await result.current.pickAndUpload('bike-1' as BikeId);
    });

    expect(returnValue).toContain('bikes/user-123/bike-1/');
    expect(mockUpload).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        bike_id: 'bike-1',
        sort_order: 3,
      }),
    );
  });

  it('limits to MAX_PHOTOS (5)', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    mockManipulate.mockResolvedValue({ uri: 'file:///compressed.jpg' });
    mockUpload.mockResolvedValue({ error: null });
    mockSelect.mockReturnValue({
      eq: mockSelectEq.mockResolvedValue({
        data: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }],
        error: null,
      }),
    });

    const { result } = renderHook(() => useBikePhotoUpload(), { wrapper: createQueryClientHookWrapper() });

    let returnValue: string | undefined;
    await act(async () => {
      returnValue = await result.current.pickAndUpload('bike-1' as BikeId);
    });

    expect(returnValue).toBeUndefined();
    expect(result.current.error).toBe('Maximum 5 photos allowed');
  });

  it('handles upload error', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    mockManipulate.mockResolvedValue({ uri: 'file:///compressed.jpg' });
    mockUpload.mockResolvedValue({ error: new Error('Storage full') });

    const { result } = renderHook(() => useBikePhotoUpload(), { wrapper: createQueryClientHookWrapper() });

    await act(async () => {
      await result.current.pickAndUpload('bike-1' as BikeId);
    });

    expect(result.current.error).toBe('Storage full');
    expect(result.current.isUploading).toBe(false);
  });
});
