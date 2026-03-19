import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Avatar, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '@/shared/utils';
import { spacing } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import type { ConversationListItem } from '../../types';
import { ItemStatus } from '@/shared/types';

interface ConversationCardProps {
  conversation: ConversationListItem;
  onPress?: (conversation: ConversationListItem) => void;
}

export function ConversationCard({ conversation, onPress }: ConversationCardProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('messages');

  const isCompleted =
    conversation.itemStatus === ItemStatus.Sold || conversation.itemStatus === ItemStatus.Donated;

  const statusSuffix =
    conversation.itemStatus === ItemStatus.Sold
      ? ` ${t('conversation.itemSold')}`
      : conversation.itemStatus === ItemStatus.Donated
        ? ` ${t('conversation.itemDonated')}`
        : '';

  const itemLabel = conversation.itemName
    ? t('conversation.itemReference', { itemName: conversation.itemName }) + statusSuffix
    : undefined;

  const lastMessagePreview = conversation.lastMessageBody
    ? conversation.lastMessageBody
    : t('conversation.noMessages');

  const timestamp = conversation.lastMessageAt
    ? formatRelativeTime(conversation.lastMessageAt, true)
    : '';

  return (
    <Pressable
      onPress={() => onPress?.(conversation)}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface },
        isCompleted && styles.dimmed,
      ]}
      accessibilityLabel={conversation.otherParticipantName ?? ''}
      accessibilityRole="button"
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {conversation.otherParticipantAvatarUrl ? (
          <Avatar.Image size={44} source={{ uri: conversation.otherParticipantAvatarUrl }} />
        ) : (
          <Avatar.Icon
            size={44}
            icon="account"
            style={{ backgroundColor: theme.colors.surfaceVariant }}
          />
        )}
        {conversation.unreadCount > 0 && (
          <View
            style={[
              styles.unreadDot,
              { backgroundColor: theme.colors.primary, borderColor: theme.colors.background },
            ]}
            testID="unread-dot"
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            variant="titleSmall"
            numberOfLines={1}
            style={[styles.name, { color: theme.colors.onSurface }]}
          >
            {conversation.otherParticipantName ?? ''}
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {timestamp}
          </Text>
        </View>

        {itemLabel && (
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={[styles.itemName, { color: theme.colors.primary }]}
          >
            {itemLabel}
          </Text>
        )}

        <Text
          variant="bodySmall"
          numberOfLines={1}
          style={[
            styles.preview,
            { color: theme.colors.onSurfaceVariant },
            conversation.unreadCount > 0 && { fontWeight: '600', color: theme.colors.onSurface },
          ]}
        >
          {lastMessagePreview}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  dimmed: {
    opacity: 0.6,
  },
  avatarContainer: {
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: undefined, // set dynamically via theme.colors.background
  },
  content: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    marginTop: 1,
  },
  preview: {
    marginTop: 1,
  },
});
