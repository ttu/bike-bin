import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { BrandLockup } from './BrandLockup';

describe('BrandLockup', () => {
  it('renders the wordmark', () => {
    renderWithProviders(<BrandLockup />);
    expect(screen.getByText('BIKE BIN')).toBeOnTheScreen();
  });

  it('renders the caption when provided', () => {
    renderWithProviders(<BrandLockup caption="Workshop inventory · BB/001" />);
    expect(screen.getByText('Workshop inventory · BB/001')).toBeOnTheScreen();
  });

  it('omits the caption when not provided', () => {
    renderWithProviders(<BrandLockup />);
    expect(screen.queryByText(/BB\/001/)).not.toBeOnTheScreen();
  });

  it('exposes an accessibility label when supplied', () => {
    renderWithProviders(<BrandLockup accessibilityLabel="Bike Bin · Workshop inventory" />);
    expect(screen.getByLabelText('Bike Bin · Workshop inventory')).toBeOnTheScreen();
  });
});
