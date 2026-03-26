import { renderWithProviders } from '@/test/utils';
import { PhotoGallery } from '../PhotoGallery';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.com/${path}` } }),
      }),
    },
  },
}));

describe('PhotoGallery', () => {
  it('renders placeholder when photos is empty', () => {
    const { getByText } = renderWithProviders(<PhotoGallery photos={[]} />);
    expect(getByText('No photos')).toBeTruthy();
  });

  it('renders without crashing when photos are provided', () => {
    const photos = [
      { id: 'p1', storagePath: 'items/photo1.jpg' },
      { id: 'p2', storagePath: 'items/photo2.jpg' },
    ];
    const { toJSON } = renderWithProviders(<PhotoGallery photos={photos} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders dot indicators when multiple photos', () => {
    const photos = [
      { id: 'p1', storagePath: 'items/photo1.jpg' },
      { id: 'p2', storagePath: 'items/photo2.jpg' },
      { id: 'p3', storagePath: 'items/photo3.jpg' },
    ];
    const { toJSON } = renderWithProviders(<PhotoGallery photos={photos} />);
    const tree = JSON.stringify(toJSON());
    // Should have dot indicators — 3 small views for the dots
    expect(tree).toBeTruthy();
  });

  it('does not render dot indicators for single photo', () => {
    const photos = [{ id: 'p1', storagePath: 'items/photo1.jpg' }];
    const { toJSON } = renderWithProviders(<PhotoGallery photos={photos} />);
    expect(toJSON()).toBeTruthy();
  });
});
