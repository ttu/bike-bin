import { useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { FAB, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Item, GroupId } from '@/shared/types';
import { GroupRole } from '@/shared/types';
import { useAuth } from '@/features/auth';
import { ItemCard } from '@/features/inventory/components/ItemCard/ItemCard';
import { useGroupItems } from '@/features/inventory/hooks/useGroupItems';
import { useGroupMembers } from '@/features/groups/hooks/useGroupMembers';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { spacing } from '@/shared/theme';

interface GroupInventoryTabProps {
  groupId: GroupId;
}

export function GroupInventoryTab({ groupId }: GroupInventoryTabProps) {
  const theme = useTheme();
  const { t } = useTranslation('groups');
  const { user } = useAuth();
  const { data: items, isLoading, refetch } = useGroupItems(groupId);
  const { data: members } = useGroupMembers(groupId);

  const isAdmin =
    members?.some((m) => m.userId === user?.id && m.role === GroupRole.Admin) ?? false;

  const handleItemPress = useCallback((item: Item) => {
    router.push(`/(tabs)/inventory/${item.id}`);
  }, []);

  const handleAddPress = useCallback(() => {
    router.push(`/(tabs)/groups/${groupId}/inventory/new`);
  }, [groupId]);

  const renderItem = useCallback(
    ({ item }: { item: Item }) => <ItemCard item={item} onPress={handleItemPress} />,
    [handleItemPress],
  );

  const hasItems = (items?.length ?? 0) > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {!isLoading && !hasItems ? (
        <EmptyState
          icon="package-variant"
          title={t('inventory.empty.title')}
          description={t('inventory.empty.description')}
          ctaLabel={isAdmin ? t('inventory.empty.cta') : undefined}
          onCtaPress={isAdmin ? handleAddPress : undefined}
        />
      ) : (
        <FlatList
          data={items ?? []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        />
      )}

      {hasItems && isAdmin && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={handleAddPress}
          accessibilityLabel={t('inventory.addItem')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: spacing.base,
  },
});
