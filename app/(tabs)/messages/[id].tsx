import { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Appbar, Avatar, Menu, Text, IconButton, useTheme } from 'react-native-paper';
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
import { ConfirmDialog, LoadingScreen } from '@/shared/components';
import { CachedAvatarImage } from '@/shared/components/CachedAvatarImage';
import { encodeReturnPath } from '@/shared/utils/returnPath';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';

type ExchangeConfirm = { kind: 'donate'; itemId: ItemId } | { kind: 'sell'; itemId: ItemId };

export default function ConversationDetailScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('messages');
  const { t: tExchange } = useTranslation('exchange');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id as ConversationId | undefined;
  const { user } = useAuth();

  const insets = useSafeAreaInsets();
  const [messageText, setMessageText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [exchangeConfirm, setExchangeConfirm] = useState<ExchangeConfirm | null>(null);

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

  // Owner/status from conversation when `useItem` is still loading (same source as list/detail).
  const itemStatusForExchange =
    item?.status ?? (conversation?.itemStatus as ItemStatus | undefined);
  const isOwner = item?.ownerId === user?.id || conversation?.itemOwnerId === user?.id;
  const canExchange =
    isOwner &&
    (itemStatusForExchange === ItemStatus.Stored || itemStatusForExchange === ItemStatus.Mounted);

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
    if (!conversation?.itemId || !conversationId) return;
    router.push({
      pathname: '/(tabs)/messages/item/[itemId]',
      params: {
        itemId: conversation.itemId,
        returnPath: encodeReturnPath(`/(tabs)/messages/${conversationId}`),
      },
    });
  }, [conversation, router, conversationId]);

  const handleOpenProfile = useCallback(() => {
    const otherId = conversation?.otherParticipantId;
    if (!otherId || !conversationId) return;
    router.push({
      pathname: '/(tabs)/profile/[userId]',
      params: {
        userId: otherId,
        returnPath: encodeReturnPath(`/(tabs)/messages/${conversationId}`),
      },
    });
  }, [conversation, router, conversationId]);

  const handleMarkDonated = useCallback(() => {
    setMenuVisible(false);
    const conv = conversation;
    if (!conv?.itemId) return;
    const itemId = conv.itemId as ItemId;

    // Defer confirm until after the Paper Menu modal finishes dismissing.
    setTimeout(() => {
      setExchangeConfirm({ kind: 'donate', itemId });
    }, 0);
  }, [conversation]);

  const handleMarkSold = useCallback(() => {
    setMenuVisible(false);
    const conv = conversation;
    if (!conv?.itemId) return;
    const itemId = conv.itemId as ItemId;

    setTimeout(() => {
      setExchangeConfirm({ kind: 'sell', itemId });
    }, 0);
  }, [conversation]);

  const handleDismissExchangeConfirm = useCallback(() => {
    setExchangeConfirm(null);
  }, []);

  const handleConfirmExchange = useCallback(() => {
    if (!exchangeConfirm) return;
    if (exchangeConfirm.kind === 'donate') {
      markDonated.mutate({
        itemId: exchangeConfirm.itemId,
      });
    } else {
      markSold.mutate({
        itemId: exchangeConfirm.itemId,
      });
    }
    setExchangeConfirm(null);
  }, [exchangeConfirm, markDonated, markSold]);

  const exchangeDialogTitle =
    exchangeConfirm?.kind === 'donate'
      ? tExchange('confirm.donate.title')
      : exchangeConfirm?.kind === 'sell'
        ? tExchange('confirm.sell.title')
        : '';

  const exchangeDialogMessage =
    exchangeConfirm?.kind === 'donate'
      ? tExchange('confirm.donate.message')
      : exchangeConfirm?.kind === 'sell'
        ? tExchange('confirm.sell.message')
        : '';

  const exchangeCancelLabel =
    exchangeConfirm?.kind === 'donate'
      ? tExchange('confirm.donate.cancel')
      : exchangeConfirm?.kind === 'sell'
        ? tExchange('confirm.sell.cancel')
        : undefined;

  const exchangeConfirmLabel =
    exchangeConfirm?.kind === 'donate'
      ? tExchange('confirm.donate.confirm')
      : exchangeConfirm?.kind === 'sell'
        ? tExchange('confirm.sell.confirm')
        : '';

  if (convLoading || msgsLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/messages')} />
          <Pressable
            style={styles.headerContent}
            onPress={handleOpenProfile}
            disabled={!conversation?.otherParticipantId}
            accessibilityRole="button"
            accessibilityLabel={t('conversation.viewProfile')}
            accessibilityState={{ disabled: !conversation?.otherParticipantId }}
            testID="conversation-header-profile"
          >
            {conversation?.otherParticipantAvatarUrl ? (
              <CachedAvatarImage uri={conversation.otherParticipantAvatarUrl} size={32} />
            ) : (
              <Avatar.Icon
                size={32}
                icon="account"
                style={{ backgroundColor: theme.colors.surfaceVariant }}
              />
            )}
            <Appbar.Content
              title={conversation?.otherParticipantName || t('conversation.anonymousUser')}
              subtitle={conversation?.itemName ?? ''}
            />
          </Pressable>
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
          <ItemReferenceCard
            conversation={conversation}
            isOwnItem={isOwner}
            onViewItem={handleViewItem}
          />
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
        <View style={{ backgroundColor: theme.colors.surface, paddingBottom: 60 + insets.bottom }}>
          <View style={styles.inputBar}>
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
        </View>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={exchangeConfirm !== null}
        title={exchangeDialogTitle}
        message={exchangeDialogMessage}
        cancelLabel={exchangeCancelLabel}
        confirmLabel={exchangeConfirmLabel}
        onDismiss={handleDismissExchangeConfirm}
        onConfirm={handleConfirmExchange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
