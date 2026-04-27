import { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { borderRadius, iconSize, spacing, type AppTheme } from '@/shared/theme';
import { NotificationType, type Notification } from '@/shared/types';
import { formatRelativeTime } from '@/shared/utils/formatRelativeTime';

/** Map notification type to an icon name. */
function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'new_message':
      return 'message-text-outline';
    case 'borrow_request_received':
      return 'swap-horizontal';
    case 'borrow_request_accepted':
      return 'check-circle-outline';
    case 'borrow_request_declined':
      return 'close-circle-outline';
    case 'return_reminder':
      return 'clock-alert-outline';
    case 'rating_prompt':
      return 'star-outline';
    default:
      return 'bell-outline';
  }
}

interface NotificationCardProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
}

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('notifications');
  const themed = useThemedStyles(theme);

  const iconName = getNotificationIcon(notification.type);
  const typeLabel = t(`types.${notification.type}`, {
    defaultValue: t('types.default'),
  });
  const timeAgo = formatRelativeTime(notification.createdAt, t);

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: notification.isRead
            ? theme.colors.surface
            : theme.colors.primaryContainer,
        },
      ]}
      onPress={() => onPress?.(notification)}
      accessibilityRole="button"
      accessibilityLabel={`${typeLabel}: ${notification.title}`}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: notification.isRead
              ? theme.colors.surfaceVariant
              : theme.colors.primary,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={iconName as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
          size={iconSize.md}
          color={notification.isRead ? theme.colors.onSurfaceVariant : theme.colors.onPrimary}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text variant="labelLarge" style={themed.onSurface} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text variant="bodySmall" style={themed.onSurfaceVariant}>
            {timeAgo}
          </Text>
        </View>

        {notification.body ? (
          <Text variant="bodyMedium" style={themed.onSurfaceVariant} numberOfLines={2}>
            {notification.body}
          </Text>
        ) : null}

        <Text variant="bodySmall" style={themed.onSurfaceVariant}>
          {typeLabel}
        </Text>
      </View>

      {!notification.isRead && (
        <View
          style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]}
          accessibilityLabel={t('unreadBadge', { count: 1 })}
        />
      )}
    </Pressable>
  );
}

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
      }),
    [theme],
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: iconSize.lg + spacing.sm,
    height: iconSize.lg + spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadDot: {
    width: spacing.sm + 2,
    height: spacing.sm + 2,
    borderRadius: borderRadius.full,
  },
});
