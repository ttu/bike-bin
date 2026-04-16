import { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Appbar, Text, FAB, Chip, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  spacing,
  borderRadius,
  iconSize,
  fabOffsetAboveTabBar,
  fabListScrollPaddingBottom,
} from '@/shared/theme';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { CenteredLoadingIndicator } from '@/shared/components/CenteredLoadingIndicator/CenteredLoadingIndicator';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import {
  useGroups,
  useCreateGroup,
  useSearchGroups,
  useJoinGroup,
  GroupCreateForm,
  GroupSearchView,
} from '@/features/groups';
import type { GroupWithRole } from '@/features/groups';
import type { GroupId } from '@/shared/types';

type ScreenMode = 'list' | 'create' | 'search';

export default function GroupsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('groups');
  const { t: tCommon } = useTranslation('common');
  const { showSnackbarAlert } = useSnackbarAlerts();
  const [mode, setMode] = useState<ScreenMode>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: groups, isLoading, isRefetching, refetch } = useGroups();
  const { data: searchResults, isLoading: isSearching } = useSearchGroups(searchQuery);
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  const handleBackToList = useCallback(() => {
    setMode('list');
    setSearchQuery('');
  }, []);

  const handleCreateSubmit = useCallback(
    async (data: { name: string; description: string | undefined; isPublic: boolean }) => {
      try {
        await createGroup.mutateAsync(data);
        showSnackbarAlert({
          message: tCommon('feedback.groupCreated'),
          variant: 'success',
        });
        setMode('list');
      } catch {
        showSnackbarAlert({
          message: t('errors.createFailed'),
          variant: 'error',
          duration: 'long',
        });
      }
    },
    [createGroup, showSnackbarAlert, t, tCommon],
  );

  const handleJoinGroup = useCallback(
    async (groupId: GroupId) => {
      try {
        await joinGroup.mutateAsync(groupId);
        showSnackbarAlert({
          message: tCommon('feedback.groupJoined'),
          variant: 'success',
        });
      } catch {
        showSnackbarAlert({ message: t('errors.joinFailed'), variant: 'error', duration: 'long' });
      }
    },
    [joinGroup, showSnackbarAlert, t, tCommon],
  );

  const handleGroupPress = useCallback((group: GroupWithRole) => {
    router.push(`/(tabs)/profile/groups/${group.id}`);
  }, []);

  if (mode === 'create') {
    return (
      <GroupCreateForm
        onBack={handleBackToList}
        onSubmit={handleCreateSubmit}
        isSubmitting={createGroup.isPending}
      />
    );
  }

  if (mode === 'search') {
    return (
      <GroupSearchView
        onBack={handleBackToList}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchResults={searchResults ?? []}
        isSearching={isSearching}
        onJoinGroup={handleJoinGroup}
        isJoining={joinGroup.isPending}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction
          testID="groups-screen-back"
          onPress={() => tabScopedBack('/(tabs)/profile')}
        />
        <Appbar.Content title={t('title')} />
        <Appbar.Action
          icon="magnify"
          onPress={() => setMode('search')}
          testID="groups-search-button"
          accessibilityLabel={t('search.placeholder')}
        />
      </Appbar.Header>

      {isLoading && (groups ?? []).length === 0 ? (
        <CenteredLoadingIndicator />
      ) : !isLoading && (groups ?? []).length === 0 ? (
        <EmptyState
          icon="account-group-outline"
          title={t('empty.title')}
          description={t('empty.description')}
          ctaLabel={t('empty.cta')}
          onCtaPress={() => setMode('create')}
        />
      ) : (
        <FlatList
          testID="groups-screen-list"
          data={groups ?? []}
          renderItem={({ item }) => <GroupCard group={item} onPress={handleGroupPress} />}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={{ paddingBottom: fabListScrollPaddingBottom(insets.bottom) }}
        />
      )}

      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            bottom: fabOffsetAboveTabBar(insets.bottom),
          },
        ]}
        color={theme.colors.onPrimary}
        onPress={() => setMode('create')}
        accessibilityLabel={t('empty.cta')}
      />
    </View>
  );
}

// ─── Inline components ───────────────────────────────────────────

function GroupCard({
  group,
  onPress,
}: {
  group: GroupWithRole;
  onPress: (group: GroupWithRole) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('groups');

  return (
    <Pressable
      onPress={() => onPress(group)}
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      accessibilityRole="button"
    >
      <View style={styles.cardIcon}>
        <MaterialCommunityIcons
          name={group.isPublic ? 'account-group' : 'lock'}
          size={iconSize.md}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.cardContent}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          {group.name}
        </Text>
        {group.description && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
            numberOfLines={1}
          >
            {group.description}
          </Text>
        )}
        <View style={styles.cardMeta}>
          <Chip compact textStyle={styles.chipText}>
            {group.isPublic ? t('detail.publicBadge') : t('detail.privateBadge')}
          </Chip>
          <Chip compact textStyle={styles.chipText}>
            {group.memberRole === 'admin' ? t('detail.admin') : t('detail.member')}
          </Chip>
        </View>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={iconSize.md}
        color={theme.colors.onSurfaceVariant}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: spacing.xs,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chipText: {
    fontSize: 11,
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: spacing.base,
  },
});
