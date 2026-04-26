import { memo, useMemo, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, useTheme } from 'react-native-paper';
import { CachedAvatarImage } from '@/shared/components/CachedAvatarImage';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '@/shared/utils';
import { spacing, type AppTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable/AnimatedPressable';
import { isGroupConversation, type ConversationListItem } from '../../types';
import { ItemStatus } from '@/shared/types';

interface ConversationCardProps {
  readonly conversation: ConversationListItem;
  readonly onPress?: (conversation: ConversationListItem) => void;
}

export const ConversationCard = memo(function ConversationCard({
  conversation,
  onPress,
}: ConversationCardProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('messages');

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        containerSurface: {
          backgroundColor: theme.customColors.surfaceContainerLowest,
        },
        avatarIcon: {
          backgroundColor: theme.colors.surfaceVariant,
        },
        unreadDot: {
          backgroundColor: theme.customColors.accent,
          borderColor: theme.customColors.surfaceContainerLowest,
        },
        name: {
          color: theme.colors.onSurface,
        },
        timestamp: {
          color: theme.colors.onSurfaceVariant,
        },
        itemName: {
          color: theme.colors.primary,
        },
        preview: {
          color: theme.colors.onSurfaceVariant,
        },
        previewUnread: {
          fontWeight: '600',
          color: theme.colors.onSurface,
        },
      }),
    [theme],
  );

  const isGroup = isGroupConversation(conversation);

  const displayName = isGroup
    ? (conversation.groupName ?? t('conversation.groupConversation'))
    : conversation.otherParticipantName || t('conversation.anonymousUser');

  const isCompleted =
    conversation.itemStatus === ItemStatus.Sold || conversation.itemStatus === ItemStatus.Donated;

  let statusSuffixKey: 'conversation.itemSold' | 'conversation.itemDonated' | undefined;
  if (conversation.itemStatus === ItemStatus.Sold) {
    statusSuffixKey = 'conversation.itemSold';
  } else if (conversation.itemStatus === ItemStatus.Donated) {
    statusSuffixKey = 'conversation.itemDonated';
  }
  const statusSuffix = statusSuffixKey ? ` ${t(statusSuffixKey)}` : '';

  const itemLabel = conversation.itemName
    ? t('conversation.itemReference', { itemName: conversation.itemName }) + statusSuffix
    : undefined;

  const lastMessagePreview = conversation.lastMessageBody
    ? conversation.lastMessageBody
    : t('conversation.noMessages');

  const timestamp = conversation.lastMessageAt
    ? formatRelativeTime(conversation.lastMessageAt, true)
    : '';

  let avatarNode: ReactNode;
  if (isGroup) {
    avatarNode = <Avatar.Icon size={44} icon="account-group" style={themedStyles.avatarIcon} />;
  } else if (conversation.otherParticipantAvatarUrl) {
    avatarNode = <CachedAvatarImage uri={conversation.otherParticipantAvatarUrl} size={44} />;
  } else {
    avatarNode = <Avatar.Icon size={44} icon="account" style={themedStyles.avatarIcon} />;
  }

  return (
    <AnimatedPressable
      onPress={() => onPress?.(conversation)}
      style={[styles.container, themedStyles.containerSurface, isCompleted && styles.dimmed]}
      accessibilityLabel={displayName}
      accessibilityRole="button"
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {avatarNode}
        {conversation.unreadCount > 0 && (
          <View style={[styles.unreadDot, themedStyles.unreadDot]} testID="unread-dot" />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text variant="titleSmall" numberOfLines={1} style={[styles.name, themedStyles.name]}>
            {displayName}
          </Text>
          <Text variant="labelSmall" style={themedStyles.timestamp}>
            {timestamp}
          </Text>
        </View>

        {itemLabel && (
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={[styles.itemName, themedStyles.itemName]}
          >
            {itemLabel}
          </Text>
        )}

        <Text
          variant="bodySmall"
          numberOfLines={1}
          style={[
            styles.preview,
            conversation.unreadCount > 0 ? themedStyles.previewUnread : themedStyles.preview,
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
