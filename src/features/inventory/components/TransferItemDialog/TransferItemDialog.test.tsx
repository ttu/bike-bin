import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { mockAuthModule } from '@/test/authMocks';
import {
  GroupRole,
  ItemStatus,
  type GroupId,
  type Item,
  type ItemId,
  type UserId,
} from '@/shared/types';
import { createMockItem } from '@/test/factories';

jest.mock('@/features/auth', () => mockAuthModule);

const mockMutate = jest.fn();
const mockUseGroups = jest.fn();

jest.mock('@/features/groups', () => ({
  useGroups: (...args: unknown[]) => mockUseGroups(...args),
}));

import { TransferItemDialog } from '../TransferItemDialog';

const mockTransferItem = { mutate: mockMutate, isPending: false } as unknown as ReturnType<
  typeof import('@/features/inventory/hooks/useTransferItem').useTransferItem
>;

const GROUP_ID = 'group-1' as GroupId;

function makeItem(overrides?: Partial<Item>): Item {
  return createMockItem({
    id: 'item-1' as ItemId,
    ownerId: 'user-123' as UserId,
    status: ItemStatus.Stored,
    ...overrides,
  } as Partial<Item>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseGroups.mockReturnValue({
    data: [
      { id: GROUP_ID, name: 'Cycling Club', memberRole: GroupRole.Admin, joinedAt: '2026-01-01' },
    ],
  });
});

describe('TransferItemDialog', () => {
  it('shows groups where user is admin', () => {
    const { getByText } = renderWithProviders(
      <TransferItemDialog
        item={makeItem()}
        visible
        onDismiss={jest.fn()}
        transferItem={mockTransferItem}
      />,
    );
    expect(getByText('Cycling Club')).toBeTruthy();
  });

  it('calls useTransferItem.mutate with toGroupId on confirm', () => {
    const onDismiss = jest.fn();
    const { getByText } = renderWithProviders(
      <TransferItemDialog
        item={makeItem()}
        visible
        onDismiss={onDismiss}
        transferItem={mockTransferItem}
      />,
    );

    fireEvent.press(getByText('Cycling Club'));
    fireEvent.press(getByText('Transfer'));

    expect(mockMutate).toHaveBeenCalledWith(
      { itemId: 'item-1', toGroupId: GROUP_ID },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it('hides groups where user is not admin', () => {
    mockUseGroups.mockReturnValue({
      data: [
        {
          id: GROUP_ID,
          name: 'Cycling Club',
          memberRole: GroupRole.Member,
          joinedAt: '2026-01-01',
        },
      ],
    });

    const { queryByText } = renderWithProviders(
      <TransferItemDialog
        item={makeItem()}
        visible
        onDismiss={jest.fn()}
        transferItem={mockTransferItem}
      />,
    );
    expect(queryByText('Cycling Club')).toBeNull();
  });

  it('does not render when not visible', () => {
    const { queryByText } = renderWithProviders(
      <TransferItemDialog
        item={makeItem()}
        visible={false}
        onDismiss={jest.fn()}
        transferItem={mockTransferItem}
      />,
    );
    expect(queryByText('Transfer to group')).toBeNull();
  });
});
