import { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { spacing } from '@/shared/theme';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { ConfirmDialog } from '@/shared/components';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useAuth } from '@/features/auth';
import {
  BorrowRequestCard,
  useBorrowRequests,
  useAcceptBorrowRequest,
  useDeclineBorrowRequest,
  useCancelBorrowRequest,
  useMarkReturned,
} from '@/features/borrow';
import type { BorrowRequestWithDetails } from '@/features/borrow';
import type { UserId } from '@/shared/types';
import { BorrowRequestStatus } from '@/shared/types';

type Tab = 'incoming' | 'outgoing' | 'active';

export default function BorrowRequestsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('borrow');

  const { user } = useAuth();
  const userId = (user?.id ?? '') as UserId;

  const [activeTab, setActiveTab] = useState<Tab>('incoming');
  const { openConfirm, closeConfirm, confirmDialogProps } = useConfirmDialog();

  const { data: allRequests, isLoading, refetch } = useBorrowRequests();
  const acceptRequest = useAcceptBorrowRequest();
  const declineRequest = useDeclineBorrowRequest();
  const cancelRequest = useCancelBorrowRequest();
  const markReturned = useMarkReturned();

  const incoming = useMemo(
    () =>
      (allRequests ?? []).filter(
        (r) =>
          r.itemOwnerId === userId &&
          (r.status === BorrowRequestStatus.Pending || r.status === BorrowRequestStatus.Rejected),
      ),
    [allRequests, userId],
  );

  const outgoing = useMemo(
    () =>
      (allRequests ?? []).filter(
        (r) =>
          r.requesterId === userId &&
          (r.status === BorrowRequestStatus.Pending ||
            r.status === BorrowRequestStatus.Rejected ||
            r.status === BorrowRequestStatus.Cancelled),
      ),
    [allRequests, userId],
  );

  const active = useMemo(
    () =>
      (allRequests ?? []).filter(
        (r) =>
          r.status === BorrowRequestStatus.Accepted &&
          (r.itemOwnerId === userId || r.requesterId === userId),
      ),
    [allRequests, userId],
  );

  const currentList =
    activeTab === 'incoming' ? incoming : activeTab === 'outgoing' ? outgoing : active;

  const handleAccept = useCallback(
    (request: BorrowRequestWithDetails) => {
      openConfirm({
        title: t('confirm.accept.title'),
        message: t('confirm.accept.message', { name: request.requesterName ?? '?' }),
        cancelLabel: t('confirm.accept.cancel'),
        confirmLabel: t('confirm.accept.confirm'),
        onConfirm: () => {
          closeConfirm();
          acceptRequest.mutate({ requestId: request.id, itemId: request.itemId });
        },
      });
    },
    [acceptRequest, t, openConfirm, closeConfirm],
  );

  const handleDecline = useCallback(
    (request: BorrowRequestWithDetails) => {
      openConfirm({
        title: t('confirm.decline.title'),
        message: t('confirm.decline.message'),
        cancelLabel: t('confirm.decline.cancel'),
        confirmLabel: t('confirm.decline.confirm'),
        destructive: true,
        onConfirm: () => {
          closeConfirm();
          declineRequest.mutate({ requestId: request.id, itemId: request.itemId });
        },
      });
    },
    [declineRequest, t, openConfirm, closeConfirm],
  );

  const handleCancel = useCallback(
    (request: BorrowRequestWithDetails) => {
      openConfirm({
        title: t('confirm.cancel.title'),
        message: t('confirm.cancel.message', { itemName: request.itemName }),
        cancelLabel: t('confirm.cancel.cancel'),
        confirmLabel: t('confirm.cancel.confirm'),
        destructive: true,
        onConfirm: () => {
          closeConfirm();
          cancelRequest.mutate({ requestId: request.id, itemId: request.itemId });
        },
      });
    },
    [cancelRequest, t, openConfirm, closeConfirm],
  );

  const handleMarkReturned = useCallback(
    (request: BorrowRequestWithDetails) => {
      openConfirm({
        title: t('confirm.markReturned.title'),
        message: t('confirm.markReturned.message'),
        cancelLabel: t('confirm.markReturned.cancel'),
        confirmLabel: t('confirm.markReturned.confirm'),
        onConfirm: () => {
          closeConfirm();
          markReturned.mutate({ requestId: request.id, itemId: request.itemId });
        },
      });
    },
    [markReturned, t, openConfirm, closeConfirm],
  );

  const renderItem = useCallback(
    ({ item }: { item: BorrowRequestWithDetails }) => (
      <View style={styles.cardWrapper}>
        <BorrowRequestCard
          request={item}
          currentUserId={userId}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onCancel={handleCancel}
          onMarkReturned={handleMarkReturned}
        />
      </View>
    ),
    [userId, handleAccept, handleDecline, handleCancel, handleMarkReturned],
  );

  const emptyConfig = {
    incoming: {
      icon: 'inbox-arrow-down',
      title: t('empty.incoming.title'),
      description: t('empty.incoming.description'),
    },
    outgoing: {
      icon: 'inbox-arrow-up',
      title: t('empty.outgoing.title'),
      description: t('empty.outgoing.description'),
    },
    active: {
      icon: 'swap-horizontal',
      title: t('empty.active.title'),
      description: t('empty.active.description'),
    },
  };

  const incomingPendingCount = incoming.filter(
    (r) => r.status === BorrowRequestStatus.Pending,
  ).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/profile')} />
        <Appbar.Content title={t('title')} />
      </Appbar.Header>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: theme.colors.outlineVariant }]}>
        {(['incoming', 'outgoing', 'active'] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          const count = tab === 'incoming' ? incomingPendingCount : undefined;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tab,
                isActive && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                variant="labelLarge"
                style={{
                  color: isActive ? theme.colors.primary : theme.colors.onSurfaceVariant,
                }}
              >
                {t(`tabs.${tab}`)}
                {count !== undefined && count > 0 ? ` (${count})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {!isLoading && currentList.length === 0 ? (
        <EmptyState
          icon={emptyConfig[activeTab].icon}
          title={emptyConfig[activeTab].title}
          description={emptyConfig[activeTab].description}
        />
      ) : (
        <FlatList
          data={currentList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          contentContainerStyle={styles.list}
        />
      )}

      <ConfirmDialog {...confirmDialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  list: {
    padding: spacing.base,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  cardWrapper: {
    marginBottom: 0,
  },
});
