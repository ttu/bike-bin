import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { formatMessageTime } from '@/shared/utils';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';
import type { MessageWithSender } from '../../types';

interface ChatBubbleProps {
  readonly message: MessageWithSender;
  readonly onLongPress?: (message: MessageWithSender) => void;
}

export function ChatBubble({ message, onLongPress }: ChatBubbleProps) {
  const theme = useTheme<AppTheme>();

  const isOwn = message.isOwn;

  const timestamp = formatMessageTime(message.createdAt);

  return (
    <Pressable
      onLongPress={onLongPress ? () => onLongPress(message) : undefined}
      delayLongPress={400}
      style={[styles.wrapper, isOwn ? styles.wrapperRight : styles.wrapperLeft]}
      accessibilityLabel={message.body}
    >
      <View
        style={[
          styles.bubble,
          isOwn
            ? [styles.bubbleOwn, { backgroundColor: theme.colors.primary }]
            : [styles.bubbleOther, { backgroundColor: theme.customColors.surfaceContainerHigh }],
        ]}
      >
        <Text
          variant="bodyMedium"
          style={{
            color: isOwn ? theme.colors.onPrimary : theme.colors.onSurface,
          }}
        >
          {message.body}
        </Text>
        <Text
          variant="labelSmall"
          style={[
            styles.timestamp,
            {
              color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
              opacity: isOwn ? 0.7 : 1,
            },
          ]}
        >
          {timestamp}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  wrapperRight: {
    alignItems: 'flex-end',
  },
  wrapperLeft: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  bubbleOwn: {
    borderBottomRightRadius: spacing.xs,
  },
  bubbleOther: {
    borderBottomLeftRadius: spacing.xs,
  },
  timestamp: {
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
});
