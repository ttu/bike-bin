import { Pressable, StyleSheet, View } from 'react-native';
import { Badge, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { iconSize } from '@/shared/theme';

interface NotificationBellProps {
  unreadCount: number;
  onPress: () => void;
}

/**
 * Bell icon with unread notification count badge.
 * Placed in the Inventory tab header.
 */
export function NotificationBell({ unreadCount, onPress }: NotificationBellProps) {
  const theme = useTheme();
  const { t } = useTranslation('notifications');
  const accessibilityLabel =
    unreadCount > 0 ? `${t('title')}, ${t('unreadBadge', { count: unreadCount })}` : t('title');

  return (
    <Pressable
      onPress={onPress}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <MaterialCommunityIcons
        name="bell-outline"
        size={iconSize.md}
        color={theme.colors.onBackground}
      />
      {unreadCount > 0 && (
        <View style={styles.badgeContainer}>
          <Badge size={16} style={{ backgroundColor: theme.colors.error }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
});
