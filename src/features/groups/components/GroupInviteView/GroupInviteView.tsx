import { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Appbar, Text, Searchbar, Button, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { CenteredLoadingIndicator } from '@/shared/components/CenteredLoadingIndicator/CenteredLoadingIndicator';
import type { GroupId, UserId } from '@/shared/types';
import {
  useCreateInvitation,
  useSearchInvitableUsers,
  type InvitableUser,
} from '../../hooks/useGroupInvitations';

type GroupInviteViewProps = {
  groupId: GroupId;
  onBack: () => void;
  onInvited: () => void;
  onError: () => void;
};

export function GroupInviteView({
  groupId,
  onBack,
  onInvited,
  onError,
}: Readonly<GroupInviteViewProps>) {
  const theme = useTheme();
  const { t } = useTranslation('groups');
  const [query, setQuery] = useState('');
  const [pendingInviteeId, setPendingInviteeId] = useState<UserId | undefined>(undefined);

  const { data: results, isLoading } = useSearchInvitableUsers(groupId, query);
  const createInvitation = useCreateInvitation();

  const handleInvite = async (userId: UserId) => {
    setPendingInviteeId(userId);
    try {
      await createInvitation.mutateAsync({ groupId, userId });
      onInvited();
    } catch {
      onError();
    } finally {
      setPendingInviteeId(undefined);
    }
  };

  const trimmed = query.trim();
  const showResults = trimmed.length > 0;

  const renderBody = () => {
    if (showResults) {
      if (isLoading) return <CenteredLoadingIndicator />;
      if ((results ?? []).length === 0) {
        return (
          <EmptyState
            icon="account-off-outline"
            title={t('invite.noResults')}
            description={t('invite.noResultsDescription')}
          />
        );
      }
      return (
        <FlatList
          data={results ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <InvitableUserRow
              user={item}
              onInvite={handleInvite}
              isPending={pendingInviteeId === item.id}
              disabled={createInvitation.isPending}
            />
          )}
          contentContainerStyle={styles.list}
        />
      );
    }
    return (
      <EmptyState
        icon="account-search-outline"
        title={t('invite.promptTitle')}
        description={t('invite.promptDescription')}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={onBack} />
        <Searchbar
          placeholder={t('invite.searchPlaceholder')}
          value={query}
          onChangeText={setQuery}
          style={styles.searchBar}
        />
      </Appbar.Header>

      {renderBody()}
    </View>
  );
}

function InvitableUserRow({
  user,
  onInvite,
  isPending,
  disabled,
}: Readonly<{
  user: InvitableUser;
  onInvite: (id: UserId) => void;
  isPending: boolean;
  disabled: boolean;
}>) {
  const theme = useTheme();
  const { t } = useTranslation('groups');

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <MaterialCommunityIcons
        name="account-circle"
        size={iconSize.lg}
        color={theme.colors.onSurfaceVariant}
      />
      <View style={styles.cardContent}>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
          {user.displayName ?? t('detail.unknownMember')}
        </Text>
      </View>
      <Button
        mode="outlined"
        compact
        onPress={() => onInvite(user.id)}
        loading={isPending}
        disabled={disabled}
      >
        {t('invite.sendInvitation')}
      </Button>
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
    paddingBottom: spacing['2xl'],
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
  cardContent: {
    flex: 1,
    gap: spacing.xs,
  },
});
