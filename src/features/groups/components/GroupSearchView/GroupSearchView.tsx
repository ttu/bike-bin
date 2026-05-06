import { useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Appbar, Text, Chip, Searchbar, Button, useTheme, type MD3Theme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius, iconSize, tabBarListScrollPaddingBottom } from '@/shared/theme';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { CenteredLoadingIndicator } from '@/shared/components/CenteredLoadingIndicator/CenteredLoadingIndicator';
import type { SearchGroupResult } from '../../types';
import { MIN_GROUP_SEARCH_QUERY_LENGTH } from '../../utils/groupSearchConstants';
import type { GroupId } from '@/shared/types';

type GroupSearchViewProps = {
  onBack: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchResults: SearchGroupResult[];
  isSearching: boolean;
  onJoinGroup: (groupId: GroupId) => void;
  isJoining: boolean;
};

export function GroupSearchView({
  onBack,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  isSearching,
  onJoinGroup,
  isJoining,
}: Readonly<GroupSearchViewProps>) {
  const theme = useTheme();
  const themed = useThemedStyles(theme);
  const { t } = useTranslation('groups');

  const hasQuery = searchQuery.length >= MIN_GROUP_SEARCH_QUERY_LENGTH;
  const showLoading = hasQuery && isSearching;
  const showEmpty = hasQuery && !isSearching && searchResults.length === 0;

  return (
    <View style={[styles.container, themed.background]}>
      <Appbar.Header dark={theme.dark} style={themed.background}>
        <Appbar.BackAction onPress={onBack} />
        <Searchbar
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          style={styles.searchBar}
        />
      </Appbar.Header>

      {showLoading ? (
        <CenteredLoadingIndicator />
      ) : showEmpty ? (
        <EmptyState
          icon="account-group-outline"
          title={t('search.noResults')}
          description={t('search.noResultsDescription')}
        />
      ) : (
        <FlatList
          data={searchResults}
          renderItem={({ item }) => (
            <SearchResultCard group={item} onJoin={onJoinGroup} isJoining={isJoining} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

function SearchResultCard({
  group,
  onJoin,
  isJoining,
}: Readonly<{
  group: SearchGroupResult;
  onJoin: (id: GroupId) => void;
  isJoining: boolean;
}>) {
  const theme = useTheme();
  const themed = useThemedStyles(theme);
  const { t } = useTranslation('groups');

  return (
    <View style={[styles.card, themed.cardSurface]}>
      <View style={styles.cardIcon}>
        <MaterialCommunityIcons
          name="account-group"
          size={iconSize.md}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.cardContent}>
        <Text variant="titleMedium" style={themed.onSurface}>
          {group.name}
        </Text>
        {group.description && (
          <Text variant="bodySmall" style={themed.onSurfaceVariant} numberOfLines={2}>
            {group.description}
          </Text>
        )}
        <Text variant="bodySmall" style={themed.onSurfaceVariant}>
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

function useThemedStyles(theme: MD3Theme) {
  return useMemo(
    () =>
      StyleSheet.create({
        background: { backgroundColor: theme.colors.background },
        cardSurface: { backgroundColor: theme.colors.surface },
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
      }),
    [theme],
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flex: 1,
  },
  list: {
    paddingBottom: tabBarListScrollPaddingBottom,
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
  chipText: {
    fontSize: 11,
  },
});
