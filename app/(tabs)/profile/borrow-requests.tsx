import { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, iconSize } from '@/shared/theme';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
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
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userId = (user?.id ?? '') as UserId;

  const [activeTab, setActiveTab] = useState<Tab>('incoming');

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
      Alert.alert(
        t('confirm.accept.title'),
        t('confirm.accept.message', { name: request.requesterName ?? '?' }),
        [
          { text: t('confirm.accept.cancel'), style: 'cancel' },
          {
            text: t('confirm.accept.confirm'),
            onPress: () => {
              acceptRequest.mutate({ requestId: request.id, itemId: request.itemId });
            },
          },
        ],
      );
    },
    [acceptRequest, t],
  );

  const handleDecline = useCallback(
    (request: BorrowRequestWithDetails) => {
      Alert.alert(t('confirm.decline.title'), t('confirm.decline.message'), [
        { text: t('confirm.decline.cancel'), style: 'cancel' },
        {
          text: t('confirm.decline.confirm'),
          style: 'destructive',
          onPress: () => {
            declineRequest.mutate({ requestId: request.id, itemId: request.itemId });
          },
        },
      ]);
    },
    [declineRequest, t],
  );

  const handleCancel = useCallback(
    (request: BorrowRequestWithDetails) => {
      Alert.alert(
        t('confirm.cancel.title'),
        t('confirm.cancel.message', { itemName: request.itemName }),
        [
          { text: t('confirm.cancel.cancel'), style: 'cancel' },
          {
            text: t('confirm.cancel.confirm'),
            style: 'destructive',
            onPress: () => {
              cancelRequest.mutate({ requestId: request.id, itemId: request.itemId });
            },
          },
        ],
      );
    },
    [cancelRequest, t],
  );

  const handleMarkReturned = useCallback(
    (request: BorrowRequestWithDetails) => {
      Alert.alert(t('confirm.markReturned.title'), t('confirm.markReturned.message'), [
        { text: t('confirm.markReturned.cancel'), style: 'cancel' },
        {
          text: t('confirm.markReturned.confirm'),
          onPress: () => {
            markReturned.mutate({ requestId: request.id, itemId: request.itemId });
          },
        },
      ]);
    },
    [markReturned, t],
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
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <MaterialCommunityIcons
            name="arrow-left"
            size={iconSize.md}
            color={theme.colors.onBackground}
          />
        </Pressable>
        <Text
          variant="headlineMedium"
          style={[styles.headerTitle, { color: theme.colors.onBackground }]}
        >
          {t('title')}
        </Text>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerTitle: {
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
