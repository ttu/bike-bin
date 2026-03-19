import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Badge, Button, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import { useAuth } from '@/features/auth';
import { useBorrowRequests } from '@/features/borrow';
import { BorrowRequestStatus } from '@/shared/types';
import type { UserId } from '@/shared/types';

export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { t: tBorrow } = useTranslation('borrow');
  const { t: tAuth } = useTranslation('auth');
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userId = (user?.id ?? '') as UserId;

  const { data: borrowRequests } = useBorrowRequests();
  const incomingPendingCount = (borrowRequests ?? []).filter(
    (r) => r.itemOwnerId === userId && r.status === BorrowRequestStatus.Pending,
  ).length;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
          {t('tabs.profile')}
        </Text>
      </View>

      {!user && (
        <View style={[styles.guestCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={48}
            color={theme.colors.primary}
          />
          <Text
            variant="titleMedium"
            style={[styles.guestTitle, { color: theme.colors.onSurface }]}
          >
            {tAuth('guestProfile.title')}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.guestDescription, { color: theme.colors.onSurfaceVariant }]}
          >
            {tAuth('guestProfile.benefits')}
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(auth)/login' as never)}
            style={styles.guestButton}
          >
            {tAuth('guestProfile.signIn')}
          </Button>
        </View>
      )}

      {/* Saved Locations */}
      <Pressable
        onPress={() => router.push('/(tabs)/profile/locations' as never)}
        style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="map-marker" size={iconSize.md} color={theme.colors.primary} />
        <Text variant="bodyLarge" style={[styles.menuLabel, { color: theme.colors.onSurface }]}>
          {t('locations:title', { defaultValue: 'Saved Locations' })}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={iconSize.md}
          color={theme.colors.onSurfaceVariant}
        />
      </Pressable>

      {/* Borrow Requests */}
      <Pressable
        onPress={() => router.push('/(tabs)/profile/borrow-requests' as never)}
        style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons
          name="swap-horizontal"
          size={iconSize.md}
          color={theme.colors.primary}
        />
        <Text variant="bodyLarge" style={[styles.menuLabel, { color: theme.colors.onSurface }]}>
          {tBorrow('profileMenu.label')}
        </Text>
        {incomingPendingCount > 0 && <Badge style={styles.badge}>{incomingPendingCount}</Badge>}
        <MaterialCommunityIcons
          name="chevron-right"
          size={iconSize.md}
          color={theme.colors.onSurfaceVariant}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  menuLabel: {
    flex: 1,
  },
  badge: {
    marginRight: spacing.sm,
  },
  guestCard: {
    margin: spacing.base,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  guestTitle: {
    textAlign: 'center',
  },
  guestDescription: {
    textAlign: 'center',
  },
  guestButton: {
    marginTop: spacing.sm,
  },
});
