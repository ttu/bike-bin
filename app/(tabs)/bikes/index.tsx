import { useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, type ListRenderItem } from 'react-native';
import { Text, FAB as Fab, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Bike } from '@/shared/types';
import { useBikes, useBikeRowCapacity } from '@/features/bikes';
import { BikeCard } from '@/features/bikes/components/BikeCard/BikeCard';
import { EmptyState } from '@/shared/components/EmptyState/EmptyState';
import { CenteredLoadingIndicator } from '@/shared/components/CenteredLoadingIndicator/CenteredLoadingIndicator';
import { spacing, fabListScrollPaddingBottom, fabOffsetAboveTabBar } from '@/shared/theme';

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

  const renderItem = useCallback<ListRenderItem<Bike>>(
    ({ item }) => <BikeCard bike={item} onPress={handleBikePress} />,
    [handleBikePress],
  );

  const insetsStyles = useMemo(
    () => ({
      container: { backgroundColor: theme.colors.background, paddingTop: insets.top },
      listContent: { paddingBottom: fabListScrollPaddingBottom(insets.bottom) },
      fab: { backgroundColor: theme.colors.primary, bottom: fabOffsetAboveTabBar(insets.bottom) },
    }),
    [theme.colors.background, theme.colors.primary, insets.top, insets.bottom],
  );

  const renderBody = () => {
    if (isLoading && bikes.length === 0) {
      return <CenteredLoadingIndicator />;
    }
    if (bikes.length === 0) {
      return (
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
      );
    }
    return (
      <FlatList
        data={bikes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={insetsStyles.listContent}
      />
    );
  };

  return (
    <View style={[styles.container, insetsStyles.container]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
          {t('title')}
        </Text>
      </View>

      {renderBody()}

      {bikes.length > 0 && (
        <Fab
          icon="plus"
          style={[styles.fab, insetsStyles.fab]}
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
  fab: {
    position: 'absolute',
    right: spacing.base,
  },
});
