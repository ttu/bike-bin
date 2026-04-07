import { renderHook, act } from '@testing-library/react-native';
import { mockAuthModule } from '@/test/authMocks';
import * as ImagePicker from 'expo-image-picker';
import type { ItemId } from '@/shared/types';
import { usePhotoUpload } from '../usePhotoUpload';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';

// Mock dependencies
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://test.jpg' }],
  }),
}));

jest.mock('@/shared/utils/compressImageForMobileUpload', () => ({
  compressImageForMobileUpload: jest.fn().mockResolvedValue({ uri: 'file://compressed.jpg' }),
}));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

jest.mock('@/features/auth', () => mockAuthModule);

// Mock fetch for blob conversion
global.fetch = jest.fn().mockResolvedValue({
  blob: jest.fn().mockResolvedValue(new Blob()),
}) as jest.Mock;

describe('usePhotoUpload', () => {
  it('starts with isUploading false and no error', () => {
    const { result } = renderHook(() => usePhotoUpload(), {
      wrapper: createQueryClientHookWrapper(),
    });
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('uploads a photo and returns storage path', async () => {
    const { result } = renderHook(() => usePhotoUpload(), {
      wrapper: createQueryClientHookWrapper(),
    });

    let storagePath: string | undefined;
    await act(async () => {
      storagePath = await result.current.pickAndUpload('item-1' as ItemId);
    });

    expect(storagePath).toMatch(/items\/user-123\/item-1\/.+\.jpg/);
    expect(result.current.isUploading).toBe(false);
  });

  it('handles permission denied', async () => {
    jest
      .mocked(ImagePicker.requestMediaLibraryPermissionsAsync)
      .mockResolvedValueOnce({ granted: false } as never);

    const { result } = renderHook(() => usePhotoUpload(), {
      wrapper: createQueryClientHookWrapper(),
    });

    let storagePath: string | undefined;
    await act(async () => {
      storagePath = await result.current.pickAndUpload('item-1' as ItemId);
    });

    expect(storagePath).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('handles user cancellation', async () => {
    jest
      .mocked(ImagePicker.requestMediaLibraryPermissionsAsync)
      .mockResolvedValueOnce({ granted: true } as never);
    jest
      .mocked(ImagePicker.launchImageLibraryAsync)
      .mockResolvedValueOnce({ canceled: true, assets: [] } as never);

    const { result } = renderHook(() => usePhotoUpload(), {
      wrapper: createQueryClientHookWrapper(),
    });

    let storagePath: string | undefined;
    await act(async () => {
      storagePath = await result.current.pickAndUpload('item-1' as ItemId);
    });

    expect(storagePath).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });
});
