import { useMemo } from 'react';
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
  const themed = useMemo(
    () =>
      StyleSheet.create({
        bubbleOwn: { backgroundColor: theme.colors.primary },
        bubbleOther: { backgroundColor: theme.customColors.surfaceContainerHigh },
        textOwn: { color: theme.colors.onPrimary },
        textOther: { color: theme.colors.onSurface },
        timestampOwn: { color: theme.colors.onPrimary, opacity: 0.7 },
        timestampOther: { color: theme.colors.onSurfaceVariant },
      }),
    [theme],
  );

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
          isOwn ? [styles.bubbleOwn, themed.bubbleOwn] : [styles.bubbleOther, themed.bubbleOther],
        ]}
      >
        <Text variant="bodyMedium" style={isOwn ? themed.textOwn : themed.textOther}>
          {message.body}
        </Text>
        <Text
          variant="labelSmall"
          style={[styles.timestamp, isOwn ? themed.timestampOwn : themed.timestampOther]}
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
