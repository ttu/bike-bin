import { renderHook, act } from '@testing-library/react-native';
import { mockAuthModule } from '@/test/authMocks';
import type { BikeId } from '@/shared/types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { max?: number; limit?: number }) => {
      if (key === 'limit.maxPhotosPerEntity') {
        return `Maximum ${opts?.max ?? '?'} photos per bike.`;
      }
      if (key === 'limit.photoAccountFull') {
        return `Photo account full (${opts?.limit})`;
      }
      if (key === 'limit.saveSnackbarPhoto') {
        return 'Could not add photos — plan photo limit reached.';
      }
      if (key === 'errors.uploadFailed') {
        return 'Upload failed. Please try again.';
      }
      return key;
    },
  }),
}));

// Mock expo-image-picker
const mockRequestPermissions = jest.fn();
const mockLaunchLibrary = jest.fn();
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: () => mockRequestPermissions(),
  launchImageLibraryAsync: () => mockLaunchLibrary(),
}));

const mockCompress = jest.fn();
jest.mock('@/shared/utils/compressImageForMobileUpload', () => ({
  compressImageForMobileUpload: (...args: unknown[]) => mockCompress(...args),
}));

// Mock supabase
const mockUpload = jest.fn();
const mockInsert = jest.fn();
const mockSelectEq = jest.fn();
const mockSelect = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    rpc: jest.fn((name: string) => {
      if (name === 'get_my_photo_limit') {
        return Promise.resolve({ data: 10_000, error: null });
      }
      if (name === 'get_my_photo_count') {
        return Promise.resolve({ data: 0, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
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

jest.mock('@/features/auth', () => mockAuthModule);

// Mock fetch for blob conversion
const mockBlob = { type: 'image/jpeg' };
globalThis.fetch = jest.fn().mockResolvedValue({
  blob: () => Promise.resolve(mockBlob),
}) as jest.Mock;

import { useBikePhotoUpload } from '../useBikePhotoUpload';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

describe('useBikePhotoUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCompress.mockResolvedValue({ uri: 'file:///compressed.jpg' });
    // Default: getPhotoCount returns 0 photos, upload/insert succeed
    mockSelect.mockReturnValue({ eq: mockSelectEq });
    mockSelectEq.mockResolvedValue({ data: [] });
    mockUpload.mockResolvedValue({ error: undefined });
    mockInsert.mockResolvedValue({ error: undefined });
  });

  it('returns error when permission denied', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: false });

    const { result } = renderHook(() => useBikePhotoUpload(), {
      wrapper: createQueryClientHookWrapper(),
    });

    let returnValue: string | undefined;
    await act(async () => {
      returnValue = await result.current.pickAndUpload('bike-1' as BikeId);
    });

    expect(returnValue).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('returns undefined when user cancels picker', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: [] });

    const { result } = renderHook(() => useBikePhotoUpload(), {
      wrapper: createQueryClientHookWrapper(),
    });

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
    mockCompress.mockResolvedValue({ uri: 'file:///compressed.jpg' });
    mockUpload.mockResolvedValue({ error: null });
    mockSelect.mockReturnValue({
      eq: mockSelectEq.mockResolvedValue({ data: [{ id: 'p1' }, { id: 'p2' }], error: null }),
    });
    mockInsert.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useBikePhotoUpload(), {
      wrapper: createQueryClientHookWrapper(),
    });

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
    mockCompress.mockResolvedValue({ uri: 'file:///compressed.jpg' });
    mockUpload.mockResolvedValue({ error: null });
    mockSelect.mockReturnValue({
      eq: mockSelectEq.mockResolvedValue({
        data: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }],
        error: null,
      }),
    });

    const { result } = renderHook(() => useBikePhotoUpload(), {
      wrapper: createQueryClientHookWrapper(),
    });

    let returnValue: string | undefined;
    await act(async () => {
      returnValue = await result.current.pickAndUpload('bike-1' as BikeId);
    });

    expect(returnValue).toBeUndefined();
    expect(result.current.error).toBe('Maximum 5 photos per bike.');
  });

  it('returns account-limit message when insert hits photo row cap', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    mockCompress.mockResolvedValue({ uri: 'file:///compressed.jpg' });
    mockUpload.mockResolvedValue({ error: null });
    mockSelect.mockReturnValue({
      eq: mockSelectEq.mockResolvedValue({ data: [{ id: 'p1' }], error: null }),
    });
    mockInsert.mockResolvedValue({
      error: { code: '23514', message: 'check constraint photo_limit_exceeded' },
    });

    const { result } = renderHook(() => useBikePhotoUpload(), {
      wrapper: createQueryClientHookWrapper(),
    });

    let returnValue: string | undefined;
    await act(async () => {
      returnValue = await result.current.pickAndUpload('bike-1' as BikeId);
    });

    expect(returnValue).toBeUndefined();
    expect(result.current.error).toBe('Could not add photos — plan photo limit reached.');
    expect(result.current.isUploading).toBe(false);
  });

  it('handles upload error', async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///photo.jpg' }],
    });
    mockCompress.mockResolvedValue({ uri: 'file:///compressed.jpg' });
    mockUpload.mockResolvedValue({
      error: Object.assign(new Error('Storage full'), { message: 'Storage full' }),
    });

    const { result } = renderHook(() => useBikePhotoUpload(), {
      wrapper: createQueryClientHookWrapper(),
    });

    await act(async () => {
      await result.current.pickAndUpload('bike-1' as BikeId);
    });

    expect(result.current.error).toBe('Upload failed. Please try again.');
    expect(result.current.isUploading).toBe(false);
  });
});
