import { useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, FAB, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Bike } from '@/shared/types';
import { useBikes, useBikeRowCapacity } from '@/features/bikes';
import { BikeCard } from '@/features/bikes/components/BikeCard/BikeCard';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { CenteredLoadingIndicator } from '@/shared/components/CenteredLoadingIndicator/CenteredLoadingIndicator';
import { spacing } from '@/shared/theme';

export default function BikesScreen() {
  const theme = useTheme();
  const { t } = useTranslation('bikes');
  const insets = useSafeAreaInsets();
  const { data: bikes = [], isLoading } = useBikes();
  const { atLimit, limit, isReady: capacityReady } = useBikeRowCapacity();

  const blockNewBikes = capacityReady && atLimit && limit !== undefined;

  const handleBikePress = useCallback((bike: Bike) => {
    router.push(`/(tabs)/bikes/${bike.id}`);
  }, []);

  const handleAddPress = useCallback(() => {
    if (blockNewBikes) {
      return;
    }
    router.push('/(tabs)/bikes/new');
  }, [blockNewBikes]);

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

      {isLoading && bikes.length === 0 ? (
        <CenteredLoadingIndicator />
      ) : !isLoading && bikes.length === 0 ? (
        <EmptyState
          icon="bicycle"
          title={t('noBikes')}
          description={
            blockNewBikes && limit !== undefined
              ? t('limit.emptyStateDescription', { limit })
              : t('noBikesDescription')
          }
          ctaLabel={t('addBike')}
          onCtaPress={handleAddPress}
          ctaDisabled={blockNewBikes}
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
          disabled={blockNewBikes}
          accessibilityLabel={blockNewBikes ? t('limit.reachedFabA11y') : t('addBike')}
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
