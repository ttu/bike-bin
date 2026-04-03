import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { PhotoPicker } from '../PhotoPicker';

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
        getPublicUrl: (path: string) => ({
          data: {
            publicUrl: `https://test.supabase.co/storage/v1/object/public/item-photos/${path}`,
          },
        }),
      }),
    },
  },
}));

const mockPhotos = [
  { id: 'photo-1', storagePath: 'bikes/bike1/photo1.jpg' },
  { id: 'photo-2', storagePath: 'bikes/bike1/photo2.jpg' },
];

describe('PhotoPicker', () => {
  beforeEach(() => {
    mockExpoImage.mockClear();
  });

  it('renders photo images from storage URLs with disk cache', () => {
    renderWithProviders(<PhotoPicker photos={mockPhotos} onAdd={jest.fn()} isUploading={false} />);
    expect(mockExpoImage).toHaveBeenCalledTimes(2);
    const first = mockExpoImage.mock.calls[0][0] as {
      source: { uri: string; cacheKey: string };
      cachePolicy: string;
    };
    const second = mockExpoImage.mock.calls[1][0] as typeof first;
    expect(first.source.uri).toContain('photo1.jpg');
    expect(first.source.cacheKey).toBe('bikes/bike1/photo1.jpg');
    expect(first.cachePolicy).toBe('memory-disk');
    expect(second.source.uri).toContain('photo2.jpg');
    expect(second.source.cacheKey).toBe('bikes/bike1/photo2.jpg');
  });

  it('shows primary badge on first photo', () => {
    const { getByText } = renderWithProviders(
      <PhotoPicker photos={mockPhotos} onAdd={jest.fn()} isUploading={false} />,
    );
    expect(getByText('1')).toBeTruthy();
  });

  it('shows add button when under max photos', () => {
    const { getByLabelText } = renderWithProviders(
      <PhotoPicker photos={mockPhotos} onAdd={jest.fn()} isUploading={false} />,
    );
    expect(getByLabelText('Add photo')).toBeTruthy();
  });

  it('calls onAdd when add button pressed', () => {
    const onAdd = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <PhotoPicker photos={mockPhotos} onAdd={onAdd} isUploading={false} />,
    );
    fireEvent.press(getByLabelText('Add photo'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('calls onRemove when remove button pressed', () => {
    const onRemove = jest.fn();
    const { getAllByLabelText } = renderWithProviders(
      <PhotoPicker photos={mockPhotos} onAdd={jest.fn()} onRemove={onRemove} isUploading={false} />,
    );
    fireEvent.press(getAllByLabelText('Remove photo')[0]);
    expect(onRemove).toHaveBeenCalledWith('photo-1');
  });

  it('disables add button when uploading', () => {
    const onAdd = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <PhotoPicker photos={mockPhotos} onAdd={onAdd} isUploading={true} />,
    );
    const addButton = getByLabelText('Add photo');
    expect(addButton.props.accessibilityState?.disabled).toBe(true);
  });
});
