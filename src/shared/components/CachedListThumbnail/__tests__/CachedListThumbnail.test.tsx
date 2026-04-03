import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { CachedListThumbnail } from '../CachedListThumbnail';

const mockImage = jest.fn();

jest.mock('expo-image', () => ({
  Image: (props: Record<string, unknown>) => {
    mockImage(props);
    return null;
  },
}));

describe('CachedListThumbnail', () => {
  beforeEach(() => {
    mockImage.mockClear();
  });

  it('uses memory-disk cache and cover fit', () => {
    render(
      <CachedListThumbnail
        uri="https://cdn.example.com/a.jpg"
        style={StyleSheet.absoluteFillObject}
      />,
    );
    expect(mockImage).toHaveBeenCalledWith(
      expect.objectContaining({
        cachePolicy: 'memory-disk',
        contentFit: 'cover',
        accessible: false,
        recyclingKey: 'https://cdn.example.com/a.jpg',
        source: { uri: 'https://cdn.example.com/a.jpg', cacheKey: 'https://cdn.example.com/a.jpg' },
      }),
    );
  });

  it('uses cacheKey for source cacheKey and recyclingKey when provided', () => {
    render(
      <CachedListThumbnail
        uri="https://cdn.example.com/a.jpg"
        cacheKey="user/x/photo.webp"
        style={StyleSheet.absoluteFillObject}
      />,
    );
    expect(mockImage).toHaveBeenCalledWith(
      expect.objectContaining({
        recyclingKey: 'user/x/photo.webp',
        source: { uri: 'https://cdn.example.com/a.jpg', cacheKey: 'user/x/photo.webp' },
      }),
    );
  });
});
