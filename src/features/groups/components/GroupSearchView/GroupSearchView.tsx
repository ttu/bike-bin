import { View, FlatList, StyleSheet } from 'react-native';
import { Appbar, Text, Chip, Searchbar, Button, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius, iconSize, tabBarListScrollPaddingBottom } from '@/shared/theme';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { CenteredLoadingIndicator } from '@/shared/components/CenteredLoadingIndicator/CenteredLoadingIndicator';
import type { SearchGroupResult } from '../../types';
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
}: GroupSearchViewProps) {
  const theme = useTheme();
  const { t } = useTranslation('groups');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={onBack} />
        <Searchbar
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          style={styles.searchBar}
        />
      </Appbar.Header>

      {searchQuery.length >= 2 && isSearching ? (
        <CenteredLoadingIndicator />
      ) : searchQuery.length >= 2 && !isSearching && searchResults.length === 0 ? (
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
