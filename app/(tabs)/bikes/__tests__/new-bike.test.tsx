import React from 'react';
import { renderWithProviders } from '@/test/utils';
import NewBikeScreen from '../new';

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://test/${path}` } }),
      }),
    },
  },
}));

jest.mock('@/shared/utils/tabScopedBack', () => ({
  tabScopedBack: jest.fn(),
}));

jest.mock('@/features/bikes', () => ({
  useCreateBike: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('@/features/bikes/components/BikeForm/BikeForm', () => ({
  BikeForm: () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return <Text testID="bike-form-placeholder">BikeForm</Text>;
  },
}));

describe('NewBikeScreen', () => {
  it('renders app bar title and bike form', () => {
    const { getByText, getByTestId } = renderWithProviders(<NewBikeScreen />);
    expect(getByText('Add Bike')).toBeTruthy();
    expect(getByTestId('bike-form-placeholder')).toBeTruthy();
  });
});
