import { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Appbar, Menu, Text, IconButton, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { AppTheme } from '@/shared/theme';
import { spacing } from '@/shared/theme';
import { ItemStatus } from '@/shared/types';
import type { ConversationId, ItemId } from '@/shared/types';
import {
  useConversation,
  useMessages,
  useSendMessage,
  useRealtimeMessages,
  ChatBubble,
  ItemReferenceCard,
} from '@/features/messaging';
import type { MessageWithSender } from '@/features/messaging';
import { useItem } from '@/features/inventory';
import { useMarkDonated, useMarkSold } from '@/features/exchange';
import { useAuth } from '@/features/auth';
import { LoadingScreen } from '@/shared/components';

export default function ConversationDetailScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('messages');
  const { t: tExchange } = useTranslation('exchange');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id as ConversationId | undefined;
  const { user } = useAuth();

  const [messageText, setMessageText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const { data: conversation, isLoading: convLoading } = useConversation(conversationId);
  const { data: item } = useItem(conversation?.itemId as ItemId);
  const {
    data: messagesData,
    isLoading: msgsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const markDonated = useMarkDonated();
  const markSold = useMarkSold();

  // Subscribe to realtime updates
  useRealtimeMessages(conversationId);

  // Determine if current user is the item owner and can perform exchange actions
  const isOwner = item?.ownerId === user?.id;
  const canExchange =
    isOwner && (item?.status === ItemStatus.Stored || item?.status === ItemStatus.Mounted);

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

  const handleMarkDonated = useCallback(() => {
    setMenuVisible(false);
    if (!conversation?.itemId) return;
    Alert.alert(tExchange('confirm.donate.title'), tExchange('confirm.donate.message'), [
      { text: tExchange('confirm.donate.cancel'), style: 'cancel' },
      {
        text: tExchange('confirm.donate.confirm'),
        onPress: () => {
          markDonated.mutate({
            itemId: conversation.itemId as ItemId,
            recipientId: conversation.otherParticipantId,
          });
        },
      },
    ]);
  }, [conversation, tExchange, markDonated]);

  const handleMarkSold = useCallback(() => {
    setMenuVisible(false);
    if (!conversation?.itemId) return;
    Alert.alert(tExchange('confirm.sell.title'), tExchange('confirm.sell.message'), [
      { text: tExchange('confirm.sell.cancel'), style: 'cancel' },
      {
        text: tExchange('confirm.sell.confirm'),
        onPress: () => {
          markSold.mutate({
            itemId: conversation.itemId as ItemId,
            buyerId: conversation.otherParticipantId,
          });
        },
      },
    ]);
  }, [conversation, tExchange, markSold]);

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
          {canExchange && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Appbar.Action
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(true)}
                  accessibilityLabel={t('conversation.moreActions')}
                />
              }
            >
              <Menu.Item
                onPress={handleMarkDonated}
                title={tExchange('ownerActions.markDonated')}
                leadingIcon="gift-outline"
              />
              <Menu.Item
                onPress={handleMarkSold}
                title={tExchange('ownerActions.markSold')}
                leadingIcon="cash"
              />
            </Menu>
          )}
        </Appbar.Header>

        {/* Pinned item reference card */}
        {conversation && conversation.itemId && (
          <ItemReferenceCard conversation={conversation} onViewItem={handleViewItem} />
        )}

        {/* Messages list (inverted = newest at bottom) */}
        <FlatList
          data={messages}
          keyExtractor={(listItem) => listItem.id}
          renderItem={({ item: listItem }) => <ChatBubble message={listItem} />}
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
        <View style={[styles.inputBar, { backgroundColor: theme.colors.surface }]}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.customColors.surfaceContainerHighest,
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
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    fontSize: 16,
  },
});
