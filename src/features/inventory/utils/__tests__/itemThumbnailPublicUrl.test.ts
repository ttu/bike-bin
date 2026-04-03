import { getItemThumbnailPublicUrl } from '../itemThumbnailPublicUrl';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://example.test/photos/${path}` },
        }),
      }),
    },
  },
}));

describe('getItemThumbnailPublicUrl', () => {
  it('returns undefined when path is missing', () => {
    expect(getItemThumbnailPublicUrl(undefined)).toBeUndefined();
  });

  it('returns public URL for a storage path', () => {
    expect(getItemThumbnailPublicUrl('user/x/thumb.jpg')).toBe(
      'https://example.test/photos/user/x/thumb.jpg',
    );
  });
});
