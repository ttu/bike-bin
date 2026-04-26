import { renderWithProviders } from '@/test/utils';
import { BikeCard } from '../BikeCard';
import { ItemCondition, type Bike, type BikeId, type UserId } from '@/shared/types';
import { fireEvent } from '@testing-library/react-native';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.com/${path}` } }),
      }),
    },
  },
}));

function createBike(overrides?: Partial<Bike>): Bike {
  return {
    id: 'bike-1' as BikeId,
    ownerId: 'user-1' as UserId,
    name: 'My Gravel Bike',
    brand: undefined,
    model: undefined,
    type: 'gravel',
    year: undefined,
    distanceKm: undefined,
    usageHours: undefined,
    condition: ItemCondition.Good,
    notes: undefined,
    thumbnailStoragePath: undefined,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    ...overrides,
  };
}

describe('BikeCard', () => {
  it('renders bike name', () => {
    const { getByText } = renderWithProviders(<BikeCard bike={createBike()} />);
    expect(getByText('My Gravel Bike')).toBeTruthy();
  });

  it('renders brand and year when present', () => {
    const bike = createBike({ brand: 'Canyon', year: 2024 });
    const { getByText } = renderWithProviders(<BikeCard bike={bike} />);
    expect(getByText(/Canyon/)).toBeTruthy();
    expect(getByText(/2024/)).toBeTruthy();
  });

  it('calls onPress with bike', () => {
    const onPress = jest.fn();
    const bike = createBike();
    const { getByLabelText } = renderWithProviders(<BikeCard bike={bike} onPress={onPress} />);
    fireEvent.press(getByLabelText('My Gravel Bike'));
    expect(onPress).toHaveBeenCalledWith(bike);
  });

  it('renders fallback icon when no thumbnail', () => {
    const bike = createBike({ thumbnailStoragePath: undefined });
    const { getByText } = renderWithProviders(<BikeCard bike={bike} />);
    expect(getByText('My Gravel Bike')).toBeTruthy();
  });
});
