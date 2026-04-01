import { useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, FAB, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Bike } from '@/shared/types';
import { useBikes } from '@/features/bikes';
import { BikeCard } from '@/features/bikes/components/BikeCard/BikeCard';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { spacing } from '@/shared/theme';

export default function BikesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('bikes');
  const insets = useSafeAreaInsets();
  const { data: bikes = [], isLoading } = useBikes();

  const handleBikePress = useCallback((bike: Bike) => {
    router.push(`/(tabs)/bikes/${bike.id}` as never);
  }, []);

  const handleAddPress = useCallback(() => {
    router.push('/(tabs)/bikes/new' as never);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Bike }) => <BikeCard bike={item} onPress={handleBikePress} />,
    [handleBikePress],
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
      </View>

      {!isLoading && bikes.length === 0 ? (
        <EmptyState
          icon="bicycle"
          title={t('noBikes')}
          description={t('noBikesDescription')}
          ctaLabel={t('addBike')}
          onCtaPress={handleAddPress}
        />
      ) : (
        <FlatList
          data={bikes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      {bikes.length > 0 && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={handleAddPress}
          accessibilityLabel={t('addBike')}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  list: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    bottom: 80,
  },
});
