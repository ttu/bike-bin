import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { PhotoPicker } from '../PhotoPicker';

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
  it('renders photo images from storage URLs', () => {
    const { UNSAFE_queryAllByType } = renderWithProviders(
      <PhotoPicker photos={mockPhotos} onAdd={jest.fn()} isUploading={false} />,
    );
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Image } = require('react-native');
    const images = UNSAFE_queryAllByType(Image);
    expect(images).toHaveLength(2);
    expect(images[0].props.source.uri).toContain('photo1.jpg');
    expect(images[1].props.source.uri).toContain('photo2.jpg');
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
