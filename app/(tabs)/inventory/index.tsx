import { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Image,
  Dimensions,
  Pressable,
} from 'react-native';
import { Text, Button, FAB, useTheme } from 'react-native-paper';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Item, ItemCategory } from '@/shared/types';
import { useAuth } from '@/features/auth';
import { SyncBanner } from '@/features/auth/components/SyncBanner/SyncBanner';
import { useLocalInventory } from '@/features/auth/hooks/useLocalInventory';
import { useItems } from '@/features/inventory';
import { ItemCard } from '@/features/inventory/components/ItemCard/ItemCard';
import { CategoryFilter } from '@/features/inventory/components/CategoryFilter/CategoryFilter';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { NotificationBell } from '@/features/notifications/components/NotificationBell/NotificationBell';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/useUnreadNotificationCount';
import { DemoBanner } from '@/features/demo';
import { supabase } from '@/shared/api/supabase';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { getStatusColor } from '@/features/inventory/utils/status';

export default function InventoryScreen() {
  const theme = useTheme();
  const { t } = useTranslation('inventory');
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | undefined>(undefined);

  const { data: unreadCount } = useUnreadNotificationCount();
  const { data: serverItems, isLoading: serverLoading, refetch } = useItems();
  const { items: localItems, isLoading: localLoading } = useLocalInventory();

  const items = isAuthenticated ? (serverItems ?? []) : localItems;
  const isLoading = isAuthenticated ? serverLoading : localLoading;

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  const handleItemPress = useCallback((item: Item) => {
    router.push(`/(tabs)/inventory/${item.id}` as never);
  }, []);

  const handleAddPress = useCallback(() => {
    router.push('/(tabs)/inventory/new' as never);
  }, []);

  const heroItem = filteredItems.length > 0 ? filteredItems[0] : null;
  const listItems = filteredItems.length > 1 ? filteredItems.slice(1) : [];

  const renderItem = useCallback(
    ({ item, index }: { item: Item; index: number }) => (
      <Animated.View entering={FadeInUp.duration(300).delay(Math.min(index, 10) * 50)}>
        <ItemCard item={item} onPress={handleItemPress} />
      </Animated.View>
    ),
    [handleItemPress],
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
          {t('title')}
        </Text>
        <View style={styles.headerActions}>
          <NotificationBell
            unreadCount={unreadCount ?? 0}
            onPress={() => router.push('/(tabs)/inventory/notifications' as never)}
          />
          <Button
            mode="text"
            compact
            onPress={() => router.push('/(tabs)/inventory/bikes' as never)}
          >
            {t('bikesLink')}
          </Button>
        </View>
      </View>

      <DemoBanner />
      <SyncBanner />

      <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

      {!isLoading && filteredItems.length === 0 ? (
        <EmptyState
          icon="package-variant"
          title={t('empty.title')}
          description={t('empty.description')}
          ctaLabel={t('empty.cta')}
          onCtaPress={handleAddPress}
        />
      ) : (
        <FlatList
          data={listItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            isAuthenticated ? (
              <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            ) : undefined
          }
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            heroItem ? <HeroCard item={heroItem} onPress={handleItemPress} /> : null
          }
        />
      )}

      {filteredItems.length > 0 && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={handleAddPress}
          accessibilityLabel={t('addItem')}
        />
      )}
    </View>
  );
}

const HERO_WIDTH = Dimensions.get('window').width - spacing.base * 2;
const HERO_HEIGHT = HERO_WIDTH * (9 / 16);

function HeroCard({ item, onPress }: { item: Item; onPress: (item: Item) => void }) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');
  const statusColorToken = getStatusColor(item.status);
  const statusColor =
    statusColorToken === 'warning'
      ? theme.customColors.warning
      : statusColorToken === 'success'
        ? theme.customColors.success
        : theme.colors.outline;

  const imageUri = item.thumbnailStoragePath
    ? supabase.storage.from('item-photos').getPublicUrl(item.thumbnailStoragePath).data.publicUrl
    : null;

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={heroStyles.container}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={heroStyles.image} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={heroStyles.image}
        />
      )}

      {/* Status chip — top right */}
      <View style={[heroStyles.statusChip, { backgroundColor: statusColor + '20' }]}>
        <Text variant="labelSmall" style={{ color: statusColor }}>
          {t(`status.${item.status}`)}
        </Text>
      </View>

      {/* Title scrim — bottom */}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={heroStyles.scrim}>
        <Text variant="headlineSmall" style={heroStyles.heroTitle} numberOfLines={1}>
          {item.name}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

const heroStyles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    height: HERO_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusChip: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    height: 24,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    paddingTop: spacing.xl,
  },
  heroTitle: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
