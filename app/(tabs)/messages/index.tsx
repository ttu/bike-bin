import { useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import type { ListRenderItem } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { AppTheme } from '@/shared/theme';
import { spacing, iconSize, tabBarListScrollPaddingBottom } from '@/shared/theme';
import { useConversations, ConversationCard } from '@/features/messaging';
import type { ConversationListItem } from '@/features/messaging';
import { LoadingScreen } from '@/shared/components';
import { DemoBanner } from '@/features/demo';

export default function MessagesScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('messages');
  const router = useRouter();

  const { data: conversations, isLoading } = useConversations();

  const handleConversationPress = useCallback(
    (conversation: ConversationListItem) => {
      router.push(`/messages/${conversation.id}`);
    },
    [router],
  );

  const renderConversationItem = useCallback<ListRenderItem<ConversationListItem>>(
    ({ item }) => <ConversationCard conversation={item} onPress={handleConversationPress} />,
    [handleConversationPress],
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
          {t('title')}
        </Text>
      </View>

      <DemoBanner />

      {/* Conversation list */}
      {!conversations || conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="chat-outline"
            size={iconSize.xl}
            color={theme.colors.onSurfaceVariant}
          />
          <Text
            variant="titleMedium"
            style={[styles.emptyTitle, { color: theme.colors.onSurface }]}
          >
            {t('empty.title')}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.emptyDescription, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('empty.description')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  listContent: {
    paddingBottom: tabBarListScrollPaddingBottom,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
  },
});
