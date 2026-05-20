import { act, renderHook } from '@testing-library/react-native';
import { mockAuthModule } from '@/test/authMocks';
import { mockRouterModule, mockRouterPush } from '@/test/routerMocks';
import { createMockSearchResultItem } from '@/test/factories';
import type { GroupId, ItemPhoto, ItemPhotoId, UserId } from '@/shared/types';
import '@/shared/i18n/config';

const mockCreateConversation = jest.fn();
const mockCreateBorrowRequest = jest.fn();
const mockReportMutate = jest.fn();
const mockShowSnackbarAlert = jest.fn();

jest.mock('expo-router', () => mockRouterModule);
jest.mock('@/features/auth', () => mockAuthModule);
jest.mock('@/features/messaging', () => ({
  useCreateConversation: () => ({ mutate: mockCreateConversation }),
}));
jest.mock('@/features/borrow', () => ({
  useCreateBorrowRequest: () => ({ mutate: mockCreateBorrowRequest }),
  useRequestBorrowDialogConfig: (itemName: string) => ({
    title: 'borrow.confirm.requestBorrow.title',
    message: `borrow.confirm.requestBorrow.message:${itemName}`,
    cancelLabel: 'borrow.confirm.requestBorrow.cancel',
    confirmLabel: 'borrow.confirm.requestBorrow.confirm',
    errorMessage: 'borrow.error.requestFailed',
  }),
}));
jest.mock('@/shared/hooks/useReport', () => ({
  useReport: () => ({ mutate: mockReportMutate, isPending: false }),
}));
jest.mock('@/shared/hooks/useReportFeedbackMessages', () => ({
  useReportFeedbackMessages: () => ({
    success: 'profile.report.successMessage',
    error: 'profile.report.errorMessage',
  }),
}));
jest.mock('@/shared/components/SnackbarAlerts', () => ({
  useSnackbarAlerts: () => ({ showSnackbarAlert: mockShowSnackbarAlert }),
}));

import { useListingDetailActions } from '../useListingDetailActions';

const baseItem = createMockSearchResultItem({ ownerId: 'owner-1' as UserId });

describe('useListingDetailActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleContact', () => {
    it('creates a personal conversation and navigates on success', () => {
      mockCreateConversation.mockImplementation((_params, opts) => {
        opts.onSuccess({ conversationId: 'conv-1' });
      });

      const { result } = renderHook(() =>
        useListingDetailActions({ item: baseItem, thisListingPath: '/(tabs)/search/item-1' }),
      );

      act(() => result.current.handleContact());

      expect(mockCreateConversation).toHaveBeenCalledWith(
        { itemId: baseItem.id, otherUserId: 'owner-1' },
        expect.any(Object),
      );
      expect(mockRouterPush).toHaveBeenCalledWith('/messages/conv-1');
    });

    it('creates a group conversation when item has groupId', () => {
      const groupItem = createMockSearchResultItem({
        ownerId: undefined,
        groupId: 'group-9' as GroupId,
      });
      mockCreateConversation.mockImplementation((_params, opts) => {
        opts.onSuccess({ conversationId: 'conv-2' });
      });

      const { result } = renderHook(() =>
        useListingDetailActions({ item: groupItem, thisListingPath: '/p' }),
      );

      act(() => result.current.handleContact());

      expect(mockCreateConversation).toHaveBeenCalledWith(
        { itemId: groupItem.id, groupId: 'group-9' },
        expect.any(Object),
      );
      expect(mockRouterPush).toHaveBeenCalledWith('/messages/conv-2');
    });

    it('is a no-op when item has neither ownerId nor groupId', () => {
      const orphan = createMockSearchResultItem({ ownerId: undefined, groupId: undefined });
      const { result } = renderHook(() =>
        useListingDetailActions({ item: orphan, thisListingPath: '/p' }),
      );

      act(() => result.current.handleContact());

      expect(mockCreateConversation).not.toHaveBeenCalled();
    });

    it('shows a snackbar alert when contact creation errors', () => {
      mockCreateConversation.mockImplementation((_params, opts) => opts.onError(new Error('x')));

      const { result } = renderHook(() =>
        useListingDetailActions({ item: baseItem, thisListingPath: '/p' }),
      );

      act(() => result.current.handleContact());

      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  describe('handleOwnerPress', () => {
    it('navigates to the owner profile with returnPath param', () => {
      const { result } = renderHook(() =>
        useListingDetailActions({ item: baseItem, thisListingPath: '/(tabs)/search/item-1' }),
      );

      act(() => result.current.handleOwnerPress());

      expect(mockRouterPush).toHaveBeenCalledWith({
        pathname: '/(tabs)/profile/[userId]',
        params: { userId: 'owner-1', returnPath: encodeURIComponent('/(tabs)/search/item-1') },
      });
    });

    it('is a no-op when item has no ownerId', () => {
      const noOwner = createMockSearchResultItem({ ownerId: undefined });
      const { result } = renderHook(() =>
        useListingDetailActions({ item: noOwner, thisListingPath: '/p' }),
      );

      act(() => result.current.handleOwnerPress());

      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  describe('handleRequestBorrow', () => {
    it('submits borrow request for personal item and navigates to chat thread on success', () => {
      mockCreateBorrowRequest.mockImplementation((_params, opts) =>
        opts.onSuccess({ requestId: 'req-1', conversationId: 'conv-1' }),
      );

      const { result } = renderHook(() =>
        useListingDetailActions({ item: baseItem, thisListingPath: '/p' }),
      );

      act(() => result.current.handleRequestBorrow());
      expect(result.current.confirmDialogProps.visible).toBe(true);

      act(() => result.current.confirmDialogProps.onConfirm());

      expect(mockCreateBorrowRequest).toHaveBeenCalledWith(
        { itemId: baseItem.id, ownerId: 'owner-1', groupId: undefined },
        expect.any(Object),
      );
      expect(mockRouterPush).toHaveBeenCalledWith('/messages/conv-1');
    });

    it('submits borrow request for group item with groupId and navigates to chat thread', () => {
      const groupItem = createMockSearchResultItem({
        ownerId: undefined,
        groupId: 'group-9' as GroupId,
      });
      mockCreateBorrowRequest.mockImplementation((_params, opts) =>
        opts.onSuccess({ requestId: 'req-2', conversationId: 'conv-2' }),
      );

      const { result } = renderHook(() =>
        useListingDetailActions({ item: groupItem, thisListingPath: '/p' }),
      );

      act(() => result.current.handleRequestBorrow());
      act(() => result.current.confirmDialogProps.onConfirm());

      expect(mockCreateBorrowRequest).toHaveBeenCalledWith(
        { itemId: groupItem.id, ownerId: undefined, groupId: 'group-9' },
        expect.any(Object),
      );
      expect(mockRouterPush).toHaveBeenCalledWith('/messages/conv-2');
    });

    it('is a no-op when item has neither ownerId nor groupId', () => {
      const orphan = createMockSearchResultItem({ ownerId: undefined, groupId: undefined });

      const { result } = renderHook(() =>
        useListingDetailActions({ item: orphan, thisListingPath: '/p' }),
      );

      act(() => result.current.handleRequestBorrow());

      expect(result.current.confirmDialogProps.visible).toBe(false);
      expect(mockCreateBorrowRequest).not.toHaveBeenCalled();
    });

    it('shows snackbar when borrow request fails', () => {
      mockCreateBorrowRequest.mockImplementation((_params, opts) => opts.onError(new Error('e')));

      const { result } = renderHook(() =>
        useListingDetailActions({ item: baseItem, thisListingPath: '/p' }),
      );

      act(() => result.current.handleRequestBorrow());
      act(() => result.current.confirmDialogProps.onConfirm());

      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  describe('photo report flow', () => {
    const photo: ItemPhoto = {
      id: 'photo-1' as ItemPhotoId,
      itemId: baseItem.id,
      storagePath: 'p.jpg',
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00Z',
    };

    it('sets reportPhotoId on long-press for non-owner', () => {
      const { result } = renderHook(() =>
        useListingDetailActions({ item: baseItem, thisListingPath: '/p' }),
      );

      act(() => result.current.handlePhotoLongPress(photo));

      expect(result.current.reportPhotoId).toBe('photo-1');
    });

    it('does nothing when long-pressing on own item', () => {
      const ownItem = createMockSearchResultItem({ ownerId: 'user-123' as UserId });
      const { result } = renderHook(() =>
        useListingDetailActions({ item: ownItem, thisListingPath: '/p' }),
      );

      act(() => result.current.handlePhotoLongPress(photo));

      expect(result.current.reportPhotoId).toBeUndefined();
      expect(result.current.isOwnItem).toBe(true);
    });

    it('dismissReport clears the active report photo', () => {
      const { result } = renderHook(() =>
        useListingDetailActions({ item: baseItem, thisListingPath: '/p' }),
      );

      act(() => result.current.handlePhotoLongPress(photo));
      expect(result.current.reportPhotoId).toBe('photo-1');

      act(() => result.current.dismissReport());

      expect(result.current.reportPhotoId).toBeUndefined();
    });

    it('submits a report and clears state on success', () => {
      mockReportMutate.mockImplementation((_params, opts) => opts.onSuccess());

      const { result } = renderHook(() =>
        useListingDetailActions({ item: baseItem, thisListingPath: '/p' }),
      );

      act(() => result.current.handlePhotoLongPress(photo));
      act(() => result.current.handleReportSubmit('spam', 'because'));

      expect(mockReportMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          reporterId: 'user-123',
          targetType: 'item_photo',
          targetId: 'photo-1',
          reason: 'spam',
          text: 'because',
        }),
        expect.any(Object),
      );
      expect(result.current.reportPhotoId).toBeUndefined();
    });

    it('keeps state and surfaces error when report submission fails', () => {
      mockReportMutate.mockImplementation((_params, opts) => opts.onError(new Error('e')));

      const { result } = renderHook(() =>
        useListingDetailActions({ item: baseItem, thisListingPath: '/p' }),
      );

      act(() => result.current.handlePhotoLongPress(photo));
      act(() => result.current.handleReportSubmit('spam', undefined));

      expect(result.current.reportPhotoId).toBe('photo-1');
    });

    it('skips submission when no photo is selected', () => {
      const { result } = renderHook(() =>
        useListingDetailActions({ item: baseItem, thisListingPath: '/p' }),
      );

      act(() => result.current.handleReportSubmit('spam', undefined));

      expect(mockReportMutate).not.toHaveBeenCalled();
    });
  });
});
