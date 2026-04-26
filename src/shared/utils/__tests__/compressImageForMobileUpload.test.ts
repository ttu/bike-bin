import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { getInfoAsync } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn(),
}));

import {
  compressImageForMobileUpload,
  MOBILE_UPLOAD_MAX_BYTES,
} from '../compressImageForMobileUpload';

const mockManipulate = manipulateAsync as jest.MockedFunction<typeof manipulateAsync>;
const mockGetInfo = getInfoAsync as jest.MockedFunction<typeof getInfoAsync>;

function fileInfo(uri: string, size: number) {
  return {
    exists: true as const,
    uri,
    size,
    isDirectory: false,
    modificationTime: 0,
  };
}

describe('compressImageForMobileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockManipulate.mockReset();
    mockGetInfo.mockReset();
  });

  it('returns first output when size is within max bytes', async () => {
    mockManipulate.mockResolvedValue({ uri: 'file:///out1.jpg', width: 1, height: 1 });
    mockGetInfo.mockResolvedValue(fileInfo('file:///out1.jpg', 100_000));

    const result = await compressImageForMobileUpload('file:///in.jpg');

    expect(result.uri).toBe('file:///out1.jpg');
    expect(mockManipulate).toHaveBeenCalledTimes(1);
    expect(mockManipulate).toHaveBeenCalledWith(
      'file:///in.jpg',
      [{ resize: { width: 1024 } }],
      expect.objectContaining({ format: SaveFormat.JPEG, compress: 0.65 }),
    );
  });

  it('lowers quality until output fits max bytes', async () => {
    mockManipulate
      .mockResolvedValueOnce({ uri: 'file:///big.jpg', width: 1, height: 1 })
      .mockResolvedValueOnce({ uri: 'file:///small.jpg', width: 1, height: 1 });
    mockGetInfo
      .mockResolvedValueOnce(fileInfo('file:///big.jpg', MOBILE_UPLOAD_MAX_BYTES + 1))
      .mockResolvedValueOnce(fileInfo('file:///small.jpg', 50_000));

    const result = await compressImageForMobileUpload('file:///in.jpg');

    expect(result.uri).toBe('file:///small.jpg');
    expect(mockManipulate).toHaveBeenCalledTimes(2);
    expect(mockManipulate.mock.calls[0][2]).toMatchObject({ compress: 0.65 });
    expect(mockManipulate.mock.calls[1][2]).toMatchObject({ compress: 0.6 });
  });

  it('tries smaller width after exhausting qualities at larger width', async () => {
    const uris = [
      ...Array.from({ length: 9 }, (_, i) => `file:///w1024-attempt${i}.jpg`),
      'file:///w900-first.jpg',
    ];
    let mi = 0;
    mockManipulate.mockImplementation(async () => {
      const uri = uris[mi] ?? `file:///extra-${mi}.jpg`;
      mi += 1;
      return { uri, width: 1, height: 1 };
    });

    mockGetInfo.mockImplementation(async (uri: string) => {
      if (uri.includes('w1024')) {
        return fileInfo(uri, MOBILE_UPLOAD_MAX_BYTES + 1);
      }
      return fileInfo(uri, 40_000);
    });

    const result = await compressImageForMobileUpload('file:///in.jpg');

    expect(result.uri).toBe('file:///w900-first.jpg');
    const widths = mockManipulate.mock.calls.map(
      (c) => (c[1] as [{ resize: { width: number } }])[0].resize.width,
    );
    expect(widths.slice(0, 9).every((w) => w === 1024)).toBe(true);
    expect(widths[9]).toBe(900);
  });

  it('returns smallest output when still above max after all attempts', async () => {
    let idx = 0;
    mockManipulate.mockImplementation(async () => {
      idx += 1;
      return { uri: `file:///chunk-${idx}.jpg`, width: 1, height: 1 };
    });

    mockGetInfo.mockImplementation(async (uri: string) => {
      const chunkPattern = /chunk-(\d+)/;
      const n = Number((chunkPattern.exec(uri) ?? ['', '0'])[1]);
      return fileInfo(uri, 600_000 + n);
    });

    const result = await compressImageForMobileUpload('file:///in.jpg');

    expect(mockManipulate.mock.calls.length).toBe(4 * 9);
    expect(result.uri).toBe('file:///chunk-1.jpg');
  });

  describe('web', () => {
    const originalPlatform = Platform.OS;
    let fetchSpy: jest.SpiedFunction<typeof fetch>;

    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', { value: 'web', writable: true });
      fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response(new Uint8Array(100_000), { status: 200 }));
    });

    afterEach(() => {
      Object.defineProperty(Platform, 'OS', { value: originalPlatform, writable: true });
      fetchSpy.mockRestore();
    });

    it('uses fetch response size instead of getInfoAsync', async () => {
      mockManipulate.mockResolvedValue({ uri: 'blob:http://localhost/out', width: 1, height: 1 });

      const result = await compressImageForMobileUpload('blob:http://localhost/in');

      expect(result.uri).toBe('blob:http://localhost/out');
      expect(fetchSpy).toHaveBeenCalledWith('blob:http://localhost/out');
      expect(mockGetInfo).not.toHaveBeenCalled();
    });

    it('throws when fetch fails on web', async () => {
      mockManipulate.mockResolvedValue({ uri: 'blob:http://localhost/out', width: 1, height: 1 });
      fetchSpy.mockResolvedValue(new Response(undefined, { status: 404 }));

      await expect(compressImageForMobileUpload('blob:http://localhost/in')).rejects.toThrow(
        'compressImageForMobileUpload: output file missing',
      );
    });
  });
});
