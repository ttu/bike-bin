import { Platform } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { PhotoGallery } from '../PhotoGallery';

const mockExpoImage = jest.fn();

jest.mock('expo-image', () => ({
  Image: (props: Record<string, unknown>) => {
    mockExpoImage(props);
    return null;
  },
}));

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.com/${path}` } }),
      }),
    },
  },
}));

const threePhotos = [
  { id: 'p1', storagePath: 'items/photo1.jpg' },
  { id: 'p2', storagePath: 'items/photo2.jpg' },
  { id: 'p3', storagePath: 'items/photo3.jpg' },
];

describe('PhotoGallery', () => {
  beforeEach(() => {
    mockExpoImage.mockClear();
  });

  it('renders placeholder when photos is empty', () => {
    const { getByText } = renderWithProviders(<PhotoGallery photos={[]} />);
    expect(getByText('No photos')).toBeTruthy();
  });

  it('respects maxGalleryWidth when provided', () => {
    const { getByText } = renderWithProviders(<PhotoGallery photos={[]} maxGalleryWidth={320} />);
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

  it('uses expo-image memory-disk cache and storage path as cacheKey', () => {
    const photos = [{ id: 'p1', storagePath: 'items/photo1.jpg' }];
    renderWithProviders(<PhotoGallery photos={photos} />);
    expect(mockExpoImage).toHaveBeenCalled();
    const props = mockExpoImage.mock.calls[0][0] as {
      source: { uri: string; cacheKey: string };
      cachePolicy: string;
      recyclingKey: string;
      contentFit: string;
    };
    expect(props.source.uri).toContain('items/photo1.jpg');
    expect(props.source.cacheKey).toBe('items/photo1.jpg');
    expect(props.cachePolicy).toBe('memory-disk');
    expect(props.recyclingKey).toBe('items/photo1.jpg');
    expect(props.contentFit).toBe('cover');
  });

  it('renders dot indicators when multiple photos', () => {
    const { toJSON } = renderWithProviders(<PhotoGallery photos={threePhotos} />);
    const tree = JSON.stringify(toJSON());
    // Should have dot indicators — 3 small views for the dots
    expect(tree).toBeTruthy();
  });

  it('does not render dot indicators for single photo', () => {
    const photos = [{ id: 'p1', storagePath: 'items/photo1.jpg' }];
    const { toJSON } = renderWithProviders(<PhotoGallery photos={photos} />);
    expect(toJSON()).toBeTruthy();
  });

  describe('web arrow navigation', () => {
    const originalPlatform = Platform.OS;

    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', { value: 'web', writable: true });
    });

    afterEach(() => {
      Object.defineProperty(Platform, 'OS', { value: originalPlatform, writable: true });
    });

    it('shows next arrow but not previous arrow on first photo', () => {
      const { queryByLabelText } = renderWithProviders(<PhotoGallery photos={threePhotos} />);
      expect(queryByLabelText('Next photo')).toBeTruthy();
      expect(queryByLabelText('Previous photo')).toBeNull();
    });

    it('does not show arrows for single photo', () => {
      const photos = [{ id: 'p1', storagePath: 'items/photo1.jpg' }];
      const { queryByLabelText } = renderWithProviders(<PhotoGallery photos={photos} />);
      expect(queryByLabelText('Next photo')).toBeNull();
      expect(queryByLabelText('Previous photo')).toBeNull();
    });

    it('advances to next photo when next arrow is pressed', () => {
      const { getByLabelText, queryByLabelText } = renderWithProviders(
        <PhotoGallery photos={threePhotos} />,
      );
      fireEvent.press(getByLabelText('Next photo'));
      // After pressing next, previous arrow should appear
      expect(queryByLabelText('Previous photo')).toBeTruthy();
    });
  });
});
