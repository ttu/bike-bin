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
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Menu,
  Text,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { AppTheme } from '@/shared/theme';
import { spacing, borderRadius } from '@/shared/theme';
import {
  ItemStatus,
  type ConversationId,
  type ItemId,
  type MessageId,
  type UserId,
} from '@/shared/types';
import {
  useConversation,
  useMessages,
  useSendMessage,
  useRealtimeMessages,
  ChatBubble,
  ItemReferenceCard,
  isGroupConversation,
} from '@/features/messaging';
import type { MessageWithSender } from '@/features/messaging';
import { useItem } from '@/features/inventory';
import { useMarkDonated, useMarkSold, getExchangeDialogConfig } from '@/features/exchange';
import { useAuth } from '@/features/auth';
import { ConfirmDialog, LoadingScreen, ReportDialog, type ReportReason } from '@/shared/components';
import { useReport } from '@/shared/hooks/useReport';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { CachedAvatarImage } from '@/shared/components/CachedAvatarImage';
import { encodeReturnPath } from '@/shared/utils/returnPath';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';

type ExchangeConfirm = { kind: 'donate'; itemId: ItemId } | { kind: 'sell'; itemId: ItemId };

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        trustSignalColor: { color: theme.customColors.accent },
        groupChipBg: { backgroundColor: theme.customColors.accentTint },
        groupChipText: { color: theme.customColors.accent },
        headerBorder: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.outlineVariant,
        },
        itemContextBarBorder: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.outlineVariant,
        },
        composerBorder: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.outlineVariant,
          backgroundColor: theme.colors.surface,
        },
      }),
    [theme],
  );
}

export default function ConversationDetailScreen() {
  const theme = useTheme<AppTheme>();
  const themed = useThemedStyles(theme);
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
  const [reportMessageId, setReportMessageId] = useState<MessageId | undefined>(undefined);
  const reportMutation = useReport();
  const { showSnackbarAlert } = useSnackbarAlerts();
  const { t: tProfile } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');

  const handleMessageLongPress = useCallback((msg: MessageWithSender) => {
    // Only allow reporting messages from other users
    if (msg.isOwn) return;
    setReportMessageId(msg.id);
  }, []);

  const handleReportSubmit = useCallback(
    (reason: ReportReason, text: string | undefined) => {
      if (!user || !reportMessageId) return;
      reportMutation.mutate(
        {
          reporterId: user.id as UserId,
          targetType: 'message',
          targetId: reportMessageId,
          reason,
          text,
        },
        {
          onSuccess: () => {
            setReportMessageId(undefined);
            showSnackbarAlert({
              message: tProfile('report.successMessage'),
              variant: 'success',
            });
          },
          onError: () => {
            showSnackbarAlert({
              message: tProfile('report.errorMessage'),
              variant: 'error',
              duration: 'long',
            });
          },
        },
      );
    },
    [user, reportMessageId, reportMutation, showSnackbarAlert, tProfile],
  );

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
    const payload = trimmed;

    sendMessage(
      { conversationId, body: payload },
      {
        onSuccess: () => {
          setMessageText((prev) => (prev.trim() === payload ? '' : prev));
          showSnackbarAlert({
            message: tCommon('feedback.messageSent'),
            variant: 'success',
          });
        },
        onError: () => {
          showSnackbarAlert({
            message: tCommon('errors.generic'),
            variant: 'error',
            duration: 'long',
          });
        },
      },
    );
  }, [messageText, conversationId, sendMessage, showSnackbarAlert, tCommon]);

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
      markDonated.mutate(
        { itemId: exchangeConfirm.itemId },
        {
          onSuccess: () => {
            setExchangeConfirm(null);
            showSnackbarAlert({
              message: tCommon('feedback.markedDonated'),
              variant: 'success',
            });
          },
          onError: () => {
            setExchangeConfirm(null);
            showSnackbarAlert({
              message: tCommon('errors.generic'),
              variant: 'error',
              duration: 'long',
            });
          },
        },
      );
    } else {
      markSold.mutate(
        { itemId: exchangeConfirm.itemId },
        {
          onSuccess: () => {
            setExchangeConfirm(null);
            showSnackbarAlert({
              message: tCommon('feedback.markedSold'),
              variant: 'success',
            });
          },
          onError: () => {
            setExchangeConfirm(null);
            showSnackbarAlert({
              message: tCommon('errors.generic'),
              variant: 'error',
              duration: 'long',
            });
          },
        },
      );
    }
  }, [exchangeConfirm, markDonated, markSold, showSnackbarAlert, tCommon]);

  const exchangeDialogConfig = getExchangeDialogConfig(exchangeConfirm?.kind, tExchange);

  // TODO: derive from user profile query
  const otherUserBorrowCount = 0;
  const groupName = conversation?.groupName;

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
        <Appbar.Header
          dark={theme.dark}
          style={[{ backgroundColor: theme.colors.surface }, themed.headerBorder]}
        >
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
            {conversation && isGroupConversation(conversation) ? (
              <Avatar.Icon
                size={32}
                icon="account-group"
                style={{ backgroundColor: theme.colors.surfaceVariant }}
              />
            ) : conversation?.otherParticipantAvatarUrl ? (
              <CachedAvatarImage uri={conversation.otherParticipantAvatarUrl} size={32} />
            ) : (
              <Avatar.Icon
                size={32}
                icon="account"
                style={{ backgroundColor: theme.colors.surfaceVariant }}
              />
            )}
            <View style={styles.headerTextStack}>
              <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1}>
                {conversation && isGroupConversation(conversation)
                  ? (conversation.groupName ?? t('conversation.groupConversation'))
                  : conversation?.otherParticipantName || t('conversation.anonymousUser')}
              </Text>
              {conversation?.itemName ? (
                <Text variant="bodySmall" style={styles.headerSubtitle} numberOfLines={1}>
                  {conversation.itemName}
                </Text>
              ) : null}
              {otherUserBorrowCount > 0 && (
                <Text variant="labelSmall" style={[styles.trustSignal, themed.trustSignalColor]}>
                  {t('chat.trustSignal', { count: otherUserBorrowCount })}
                </Text>
              )}
            </View>
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
          <View style={themed.itemContextBarBorder}>
            <ItemReferenceCard
              conversation={conversation}
              isOwnItem={isOwner}
              onViewItem={handleViewItem}
            />
          </View>
        )}

        {/* Group affiliation chip — only for DM conversations where the item has a group owner */}
        {groupName && conversation && !isGroupConversation(conversation) && (
          <View style={[styles.groupChipBar, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.groupChip, themed.groupChipBg]}>
              <Text variant="labelSmall" style={themed.groupChipText}>
                {groupName}
              </Text>
            </View>
          </View>
        )}

        {/* Messages list (inverted = newest at bottom) */}
        <FlatList
          data={messages}
          keyExtractor={(listItem) => listItem.id}
          renderItem={({ item: listItem }) => (
            <ChatBubble
              message={listItem}
              onLongPress={user && !listItem.isOwn ? handleMessageLongPress : undefined}
            />
          )}
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
        <View style={[themed.composerBorder, { paddingBottom: 60 + insets.bottom }]}>
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
              editable={!isSending}
              accessibilityLabel={t('detail.inputPlaceholder')}
            />
            {isSending ? (
              <View
                style={[styles.sendSpinnerWrap, { backgroundColor: theme.colors.primary }]}
                accessibilityRole="progressbar"
                accessibilityLabel={t('detail.send')}
              >
                <ActivityIndicator color={theme.colors.onPrimary} size="small" />
              </View>
            ) : (
              <IconButton
                icon="send"
                iconColor={theme.colors.onPrimary}
                containerColor={theme.colors.primary}
                size={20}
                onPress={handleSend}
                disabled={!messageText.trim()}
                accessibilityLabel={t('detail.send')}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <ReportDialog
        visible={reportMessageId !== undefined}
        onDismiss={() => setReportMessageId(undefined)}
        onSubmit={handleReportSubmit}
        loading={reportMutation.isPending}
      />

      <ConfirmDialog
        visible={exchangeConfirm !== null}
        title={exchangeDialogConfig.title}
        message={exchangeDialogConfig.message}
        cancelLabel={exchangeDialogConfig.cancelLabel}
        confirmLabel={exchangeDialogConfig.confirmLabel}
        onDismiss={handleDismissExchangeConfirm}
        onConfirm={handleConfirmExchange}
        loading={markDonated.isPending || markSold.isPending}
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
  headerTextStack: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    flexShrink: 1,
  },
  headerSubtitle: {
    flexShrink: 1,
    opacity: 0.7,
  },
  trustSignal: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  groupChipBar: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
  },
  groupChip: {
    paddingHorizontal: spacing.sm,
    height: 22,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
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
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    fontSize: 16,
  },
  sendSpinnerWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
