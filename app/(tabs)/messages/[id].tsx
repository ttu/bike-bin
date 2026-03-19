import { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Appbar, Text, IconButton, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { AppTheme } from '@/shared/theme';
import { spacing, borderRadius } from '@/shared/theme';
import type { ConversationId } from '@/shared/types';
import {
  useConversation,
  useMessages,
  useSendMessage,
  useRealtimeMessages,
  ChatBubble,
  ItemReferenceCard,
} from '@/features/messaging';
import type { MessageWithSender } from '@/features/messaging';
import { LoadingScreen } from '@/shared/components';

export default function ConversationDetailScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('messages');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id as ConversationId | undefined;

  const [messageText, setMessageText] = useState('');

  const { data: conversation, isLoading: convLoading } = useConversation(conversationId);
  const {
    data: messagesData,
    isLoading: msgsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();

  // Subscribe to realtime updates
  useRealtimeMessages(conversationId);

  // Flatten pages into single array
  const messages = useMemo((): MessageWithSender[] => {
    if (!messagesData?.pages) return [];
    return messagesData.pages.flat();
  }, [messagesData]);

  const handleSend = useCallback(() => {
    const trimmed = messageText.trim();
    if (!trimmed || !conversationId) return;

    sendMessage(
      { conversationId, body: trimmed },
      {
        onSuccess: () => setMessageText(''),
      },
    );
  }, [messageText, conversationId, sendMessage]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleViewItem = useCallback(() => {
    if (conversation?.itemId) {
      router.push(`/search/${conversation.itemId}`);
    }
  }, [conversation, router]);

  if (convLoading || msgsLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content
            title={conversation?.otherParticipantName ?? ''}
            subtitle={conversation?.itemName ?? ''}
          />
        </Appbar.Header>

        {/* Pinned item reference card */}
        {conversation && conversation.itemId && (
          <ItemReferenceCard conversation={conversation} onViewItem={handleViewItem} />
        )}

        {/* Messages list (inverted = newest at bottom) */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          inverted
          contentContainerStyle={styles.messagesContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
              >
                {t('conversation.noMessages')}
              </Text>
            </View>
          }
        />

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.surfaceVariant,
                color: theme.colors.onSurface,
              },
            ]}
            value={messageText}
            onChangeText={setMessageText}
            placeholder={t('detail.inputPlaceholder')}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            multiline
            maxLength={2000}
            accessibilityLabel={t('detail.inputPlaceholder')}
          />
          <IconButton
            icon="send"
            iconColor={theme.colors.onPrimary}
            containerColor={theme.colors.primary}
            size={20}
            onPress={handleSend}
            disabled={!messageText.trim() || isSending}
            accessibilityLabel={t('detail.send')}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: spacing.sm,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    // FlatList is inverted, so this will appear centered when empty
    transform: [{ scaleY: -1 }],
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    fontSize: 16,
  },
});
