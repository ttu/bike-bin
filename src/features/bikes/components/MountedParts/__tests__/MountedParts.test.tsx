import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { createMockItem, createMockBike } from '@/test/factories';
import { ItemStatus } from '@/shared/types';
import { MountedParts } from '../MountedParts';

const mockRouterPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
}));

// Mock supabase
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockOrder = jest.fn();

jest.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: jest.fn((table: string) => {
      if (table === 'items') {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      return { select: mockSelect };
    }),
  },
}));

jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
    isAuthenticated: true,
  }),
}));

const bike = createMockBike();
const bikeId = bike.id;

const storedPart = createMockItem({
  name: 'Chain Ring',
  status: ItemStatus.Stored,
  bikeId: undefined,
  brand: 'Shimano',
});

const mountedPart = createMockItem({
  name: 'Brake Lever',
  status: ItemStatus.Mounted,
  bikeId: bikeId,
  brand: 'SRAM',
  model: 'Rival',
});

describe('MountedParts', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: mounted parts query returns mountedPart, items query returns both
    mockSelect.mockImplementation(() => ({
      eq: mockEq.mockImplementation(() => ({
        order: mockOrder.mockResolvedValue({ data: [mountedPart], error: null }),
        single: mockSingle.mockResolvedValue({ data: mountedPart, error: null }),
        select: mockSelect,
      })),
      order: mockOrder.mockResolvedValue({ data: [storedPart, mountedPart], error: null }),
    }));
  });

  it('renders mounted parts section title', () => {
    const { getByText } = renderWithProviders(<MountedParts bikeId={bikeId} />);
    expect(getByText('Mounted Parts')).toBeTruthy();
  });

  it('renders attach part button', () => {
    const { getAllByText } = renderWithProviders(<MountedParts bikeId={bikeId} />);
    expect(getAllByText('Attach Part').length).toBeGreaterThan(0);
  });

  it('shows empty state when no parts are mounted', () => {
    mockSelect.mockImplementation(() => ({
      eq: mockEq.mockImplementation(() => ({
        order: mockOrder.mockResolvedValue({ data: [], error: null }),
        single: mockSingle.mockResolvedValue({ data: null, error: null }),
        select: mockSelect,
      })),
      order: mockOrder.mockResolvedValue({ data: [storedPart], error: null }),
    }));

    const { getByText } = renderWithProviders(<MountedParts bikeId={bikeId} />);
    expect(getByText('Attach parts from your inventory to this bike.')).toBeTruthy();
  });

  it('opens picker dialog when attach button pressed', () => {
    const { getAllByText, getByText } = renderWithProviders(<MountedParts bikeId={bikeId} />);
    const attachButtons = getAllByText('Attach Part');
    fireEvent.press(attachButtons[0]);
    expect(getByText('Select Part to Attach')).toBeTruthy();
  });

  it('navigates to inventory item detail when a mounted part row is pressed', async () => {
    mockSelect.mockImplementation(() => ({
      eq: mockEq.mockImplementation(() => ({
        order: mockOrder.mockResolvedValue({ data: [mountedPart], error: null }),
        single: mockSingle.mockResolvedValue({ data: mountedPart, error: null }),
        select: mockSelect,
      })),
      order: mockOrder.mockResolvedValue({ data: [storedPart, mountedPart], error: null }),
    }));

    const { findByLabelText } = renderWithProviders(<MountedParts bikeId={bikeId} />);

    const viewPartControl = await findByLabelText(`View ${mountedPart.name}`);
    fireEvent.press(viewPartControl);

    expect(mockRouterPush).toHaveBeenCalledWith(
      `/(tabs)/inventory/${mountedPart.id}?fromBike=${encodeURIComponent(bikeId)}`,
    );
  });

  it('opens detach confirmation when detach button pressed', async () => {
    // First make sure the mounted part appears
    mockSelect.mockImplementation(() => ({
      eq: mockEq.mockImplementation(() => ({
        order: mockOrder.mockResolvedValue({ data: [mountedPart], error: null }),
        single: mockSingle.mockResolvedValue({ data: mountedPart, error: null }),
        select: mockSelect,
      })),
      order: mockOrder.mockResolvedValue({ data: [storedPart, mountedPart], error: null }),
    }));

    const { findByLabelText, getByText } = renderWithProviders(<MountedParts bikeId={bikeId} />);

    const detachButton = await findByLabelText('Detach');
    fireEvent.press(detachButton);

    expect(getByText(/Detach "Brake Lever" from this bike/)).toBeTruthy();
  });
});
