import { render } from '@testing-library/react-native';
import { CachedAvatarImage } from '../CachedAvatarImage';

const mockImage = jest.fn();

jest.mock('expo-image', () => ({
  Image: (props: Record<string, unknown>) => {
    mockImage(props);
    return null;
  },
}));

describe('CachedAvatarImage', () => {
  beforeEach(() => {
    mockImage.mockClear();
  });

  it('uses memory-disk cache, cover fit, and circular dimensions from size', () => {
    render(<CachedAvatarImage uri="https://cdn.example.com/a.jpg" size={40} />);
    expect(mockImage).toHaveBeenCalledWith(
      expect.objectContaining({
        cachePolicy: 'memory-disk',
        contentFit: 'cover',
        accessible: false,
        recyclingKey: 'https://cdn.example.com/a.jpg',
        source: { uri: 'https://cdn.example.com/a.jpg', cacheKey: 'https://cdn.example.com/a.jpg' },
        style: expect.objectContaining({
          width: 40,
          height: 40,
          borderRadius: 20,
        }),
      }),
    );
  });

  it('uses cacheKey for source and recyclingKey when provided', () => {
    render(
      <CachedAvatarImage
        uri="https://cdn.example.com/a.jpg"
        size={32}
        cacheKey="profiles/x/avatar.webp"
        testID="avatar"
      />,
    );
    expect(mockImage).toHaveBeenCalledWith(
      expect.objectContaining({
        testID: 'avatar',
        recyclingKey: 'profiles/x/avatar.webp',
        source: { uri: 'https://cdn.example.com/a.jpg', cacheKey: 'profiles/x/avatar.webp' },
      }),
    );
  });
});
