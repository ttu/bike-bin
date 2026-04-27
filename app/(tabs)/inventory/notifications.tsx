import { FlatList, StyleSheet } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { LoadingScreen } from '@/shared/components';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { spacing, type AppTheme } from '@/shared/theme';
import type { Notification } from '@/shared/types';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useMarkNotificationRead } from '@/features/notifications/hooks/useMarkNotificationRead';
import { useRealtimeNotifications } from '@/features/notifications/hooks/useRealtimeNotifications';
import { NotificationCard } from '@/features/notifications/components/NotificationCard/NotificationCard';

export default function NotificationsScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('notifications');
  const router = useRouter();

  const { data: notifications, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();

  // Subscribe to realtime notifications
  useRealtimeNotifications();

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      // Mark as read
      if (!notification.isRead) {
        markRead(notification.id);
      }

      // Navigate based on notification type and data
      const { type, data } = notification;
      switch (type) {
        case 'new_message':
          if (data.conversationId) {
            router.push(`/(tabs)/messages/${data.conversationId}`);
          }
          break;
        case 'borrow_request_received':
        case 'borrow_request_accepted':
        case 'borrow_request_declined':
          router.push('/(tabs)/profile/borrow-requests');
          break;
        case 'return_reminder':
          router.push('/(tabs)/profile/borrow-requests');
          break;
        default:
          break;
      }
    },
    [markRead, router],
  );

  const renderItem = useCallback(
    ({ item }: { readonly item: Notification }) => (
      <NotificationCard notification={item} onPress={handleNotificationPress} />
    ),
    [handleNotificationPress],
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/inventory')} />
        <Appbar.Content title={t('title')} />
      </Appbar.Header>

      {notifications && notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      ) : (
        <EmptyState icon="bell-off-outline" title={t('empty')} description="" />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  list: {
    paddingVertical: spacing.sm,
  },
});
