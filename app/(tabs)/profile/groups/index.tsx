import { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  Pressable,
  ScrollView,
} from 'react-native';
import {
  Text,
  FAB,
  Chip,
  TextInput,
  Searchbar,
  Button,
  Switch,
  HelperText,
  useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { useGroups, useCreateGroup, useSearchGroups, useJoinGroup } from '@/features/groups';
import type { GroupWithRole, SearchGroupResult } from '@/features/groups';
import type { GroupId } from '@/shared/types';

type ScreenMode = 'list' | 'create' | 'search';

export default function GroupsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('groups');
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<ScreenMode>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // My groups
  const { data: groups, isLoading, refetch } = useGroups();

  // Search
  const { data: searchResults, isLoading: isSearching } = useSearchGroups(searchQuery);

  // Mutations
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  // Create form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [nameError, setNameError] = useState('');

  const handleCreatePress = useCallback(() => {
    setName('');
    setDescription('');
    setIsPublic(false);
    setNameError('');
    setMode('create');
  }, []);

  const handleSearchMode = useCallback(() => {
    setSearchQuery('');
    setMode('search');
  }, []);

  const handleBack = useCallback(() => {
    setMode('list');
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    setNameError('');

    try {
      await createGroup.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
      setMode('list');
    } catch {
      Alert.alert('Error', 'Failed to create group');
    }
  }, [name, description, isPublic, createGroup]);

  const handleJoinGroup = useCallback(
    async (groupId: GroupId) => {
      try {
        await joinGroup.mutateAsync(groupId);
      } catch {
        Alert.alert('Error', 'Failed to join group');
      }
    },
    [joinGroup],
  );

  const handleGroupPress = useCallback((group: GroupWithRole) => {
    router.push(`/(tabs)/profile/groups/${group.id}` as never);
  }, []);

  // Create form
  if (mode === 'create') {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={handleBack} accessibilityRole="button">
            <MaterialCommunityIcons
              name="arrow-left"
              size={iconSize.md}
              color={theme.colors.onBackground}
            />
          </Pressable>
          <Text
            variant="headlineMedium"
            style={[styles.headerTitle, { color: theme.colors.onBackground }]}
          >
            {t('create.title')}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.formContent}>
          <Text variant="labelLarge" style={styles.label}>
            {t('create.nameLabel')}
          </Text>
          <TextInput
            mode="outlined"
            value={name}
            onChangeText={setName}
            placeholder={t('create.namePlaceholder')}
            error={!!nameError}
          />
          {nameError && (
            <HelperText type="error" visible>
              {nameError}
            </HelperText>
          )}

          <Text variant="labelLarge" style={styles.label}>
            {t('create.descriptionLabel')}
          </Text>
          <TextInput
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            placeholder={t('create.descriptionPlaceholder')}
            multiline
            numberOfLines={3}
          />

          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text variant="labelLarge">{t('create.publicLabel')}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {isPublic ? t('create.publicDescription') : t('create.privateDescription')}
              </Text>
            </View>
            <Switch value={isPublic} onValueChange={setIsPublic} />
          </View>

          <Button
            mode="contained"
            onPress={handleCreateSubmit}
            loading={createGroup.isPending}
            disabled={createGroup.isPending}
            style={styles.submitButton}
          >
            {t('create.save')}
          </Button>
        </ScrollView>
      </View>
    );
  }

  // Search mode
  if (mode === 'search') {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={handleBack} accessibilityRole="button">
            <MaterialCommunityIcons
              name="arrow-left"
              size={iconSize.md}
              color={theme.colors.onBackground}
            />
          </Pressable>
          <Searchbar
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
          />
        </View>

        {searchQuery.length >= 2 && !isSearching && (searchResults ?? []).length === 0 ? (
          <EmptyState
            icon="account-group-outline"
            title={t('search.noResults')}
            description={t('search.noResultsDescription')}
          />
        ) : (
          <FlatList
            data={searchResults ?? []}
            renderItem={({ item }) => (
              <SearchResultCard
                group={item}
                onJoin={handleJoinGroup}
                isJoining={joinGroup.isPending}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    );
  }

  // List mode (default)
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <MaterialCommunityIcons
            name="arrow-left"
            size={iconSize.md}
            color={theme.colors.onBackground}
          />
        </Pressable>
        <Text
          variant="headlineMedium"
          style={[styles.headerTitle, { color: theme.colors.onBackground }]}
        >
          {t('title')}
        </Text>
        <Pressable onPress={handleSearchMode} accessibilityRole="button">
          <MaterialCommunityIcons
            name="magnify"
            size={iconSize.md}
            color={theme.colors.onBackground}
          />
        </Pressable>
      </View>

      {!isLoading && (groups ?? []).length === 0 ? (
        <EmptyState
          icon="account-group-outline"
          title={t('empty.title')}
          description={t('empty.description')}
          ctaLabel={t('empty.cta')}
          onCtaPress={handleCreatePress}
        />
      ) : (
        <FlatList
          data={groups ?? []}
          renderItem={({ item }) => <GroupCard group={item} onPress={handleGroupPress} />}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          contentContainerStyle={styles.list}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={handleCreatePress}
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

function SearchResultCard({
  group,
  onJoin,
  isJoining,
}: {
  group: SearchGroupResult;
  onJoin: (id: GroupId) => void;
  isJoining: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation('groups');

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardIcon}>
        <MaterialCommunityIcons
          name="account-group"
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
            numberOfLines={2}
          >
            {group.description}
          </Text>
        )}
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('detail.memberCount', { count: group.memberCount })}
        </Text>
      </View>
      {group.isMember ? (
        <Chip compact textStyle={styles.chipText}>
          {t('detail.joined')}
        </Chip>
      ) : (
        <Button
          mode="outlined"
          compact
          onPress={() => onJoin(group.id)}
          loading={isJoining}
          disabled={isJoining}
        >
          {t('detail.joinGroup')}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerTitle: {
    flex: 1,
  },
  list: {
    paddingBottom: 80,
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
  searchBar: {
    flex: 1,
  },
  formContent: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  label: {
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    flex: 1,
    gap: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: spacing.base,
  },
});
