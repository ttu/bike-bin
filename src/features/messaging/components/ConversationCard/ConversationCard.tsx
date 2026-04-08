import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, useTheme } from 'react-native-paper';
import { CachedAvatarImage } from '@/shared/components/CachedAvatarImage';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '@/shared/utils';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable/AnimatedPressable';
import type { ConversationListItem } from '../../types';
import { ItemStatus } from '@/shared/types';

interface ConversationCardProps {
  conversation: ConversationListItem;
  onPress?: (conversation: ConversationListItem) => void;
}

export const ConversationCard = memo(function ConversationCard({
  conversation,
  onPress,
}: ConversationCardProps) {
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
    <AnimatedPressable
      onPress={() => onPress?.(conversation)}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.onSurface,
        },
        isCompleted && styles.dimmed,
      ]}
      accessibilityLabel={conversation.otherParticipantName || t('conversation.anonymousUser')}
      accessibilityRole="button"
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {conversation.otherParticipantAvatarUrl ? (
          <CachedAvatarImage uri={conversation.otherParticipantAvatarUrl} size={44} />
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
            {conversation.otherParticipantName || t('conversation.anonymousUser')}
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
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderRadius: borderRadius.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
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
