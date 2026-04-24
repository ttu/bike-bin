import { useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import type { ListRenderItem } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { AppTheme } from '@/shared/theme';
import { spacing, iconSize, borderRadius, tabBarListScrollPaddingBottom } from '@/shared/theme';
import { useConversations, ConversationCard } from '@/features/messaging';
import type { ConversationListItem } from '@/features/messaging';
import { LoadingScreen } from '@/shared/components';
import { ScreenMasthead } from '@/shared/components/ScreenMasthead';
import { DemoBanner } from '@/features/demo';

// padding (base) + avatar (44) + gap (md) — matches inventory list inset rhythm
const SEPARATOR_LEFT_INSET = spacing.base + 44 + spacing.md;

const separatorStyles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: SEPARATOR_LEFT_INSET,
  },
});

function ItemSeparator() {
  const theme = useTheme<AppTheme>();
  return (
    <View style={[separatorStyles.separator, { backgroundColor: theme.colors.outlineVariant }]} />
  );
}

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

  const hasConversations = conversations && conversations.length > 0;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScreenMasthead eyebrow={t('masthead.eyebrow')} title={t('masthead.title')} />

      <DemoBanner />

      {!hasConversations ? (
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
        <View
          style={[
            styles.listContainer,
            { backgroundColor: theme.customColors.surfaceContainerLowest },
          ]}
        >
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversationItem}
            ItemSeparatorComponent={ItemSeparator}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    marginHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  listContent: {
    paddingBottom: tabBarListScrollPaddingBottom,
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
