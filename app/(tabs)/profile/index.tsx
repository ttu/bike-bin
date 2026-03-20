import { View, ScrollView, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { Text, Badge, Button, SegmentedButtons, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import { useAuth } from '@/features/auth';
import { useBorrowRequests } from '@/features/borrow';
import { ProfileHeader, useProfile } from '@/features/profile';
import { useThemePreference } from '@/shared/hooks/useThemePreference';
import { BorrowRequestStatus } from '@/shared/types';
import type { UserId } from '@/shared/types';
import type { ThemePreference } from '@/shared/hooks/useThemePreference';
import { useDemoMode, DemoBanner } from '@/features/demo';

export default function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation('profile');
  const { t: tBorrow } = useTranslation('borrow');
  const { t: tGroups } = useTranslation('groups');
  const { t: tNotifications } = useTranslation('notifications');
  const { t: tAuth } = useTranslation('auth');
  const { t: tDemo } = useTranslation('demo');
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { isDemoMode, exitDemoMode } = useDemoMode();
  const userId = (user?.id ?? '') as UserId;

  const { data: profile } = useProfile(userId || undefined);
  const { preference, setPreference } = useThemePreference();
  const { data: borrowRequests } = useBorrowRequests();

  const incomingPendingCount = (borrowRequests ?? []).filter(
    (r) => r.itemOwnerId === userId && r.status === BorrowRequestStatus.Pending,
  ).length;

  const handleSignOut = () => {
    const doSignOut = async () => {
      await signOut();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${t('signOutConfirm.title')}\n${t('signOutConfirm.message')}`)) {
        doSignOut();
      }
    } else {
      Alert.alert(t('signOutConfirm.title'), t('signOutConfirm.message'), [
        { text: t('signOutConfirm.cancel'), style: 'cancel' },
        {
          text: t('signOutConfirm.confirm'),
          style: 'destructive',
          onPress: doSignOut,
        },
      ]);
    }
  };

  const handleExitDemo = () => {
    exitDemoMode();
    router.replace('/(auth)/login');
  };

  const themeButtons = [
    { value: 'system' as ThemePreference, label: t('appearance.system') },
    { value: 'light' as ThemePreference, label: t('appearance.light') },
    { value: 'dark' as ThemePreference, label: t('appearance.dark') },
  ];

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
          {t('title')}
        </Text>
      </View>

      <DemoBanner />

      {!user && !isDemoMode && (
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

      {(user || isDemoMode) && profile && (
        <ProfileHeader
          profile={profile}
          onEditPress={() => router.push('/(tabs)/profile/edit-profile' as never)}
        />
      )}

      {/* Saved Locations */}
      <MenuItem
        icon="map-marker"
        label={t('menu.savedLocations')}
        onPress={() => router.push('/(tabs)/profile/locations' as never)}
      />

      {/* Borrow Requests */}
      <MenuItem
        icon="swap-horizontal"
        label={tBorrow('profileMenu.label')}
        badge={incomingPendingCount}
        onPress={() => router.push('/(tabs)/profile/borrow-requests' as never)}
      />

      {/* Groups */}
      <MenuItem
        icon="account-group"
        label={tGroups('profileMenu.label')}
        onPress={() => router.push('/(tabs)/profile/groups' as never)}
      />

      {/* Notification Settings */}
      <MenuItem
        icon="bell-outline"
        label={tNotifications('profileMenu.label')}
        onPress={() => router.push('/(tabs)/profile/notification-settings' as never)}
      />

      {/* Appearance */}
      <View style={[styles.appearanceSection, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.appearanceHeader}>
          <MaterialCommunityIcons
            name="brightness-6"
            size={iconSize.md}
            color={theme.colors.primary}
          />
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
            {t('menu.appearance')}
          </Text>
        </View>
        <SegmentedButtons
          value={preference}
          onValueChange={(value) => setPreference(value as ThemePreference)}
          buttons={themeButtons}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Help & Support */}
      <MenuItem
        icon="help-circle-outline"
        label={t('menu.helpSupport')}
        onPress={() => router.push('/(tabs)/profile/support' as never)}
      />

      {/* About & Legal */}
      <MenuItem
        icon="information-outline"
        label={t('menu.aboutLegal')}
        onPress={() => router.push('/(tabs)/profile/about' as never)}
      />

      {/* Sign Out / Exit Demo */}
      {isDemoMode && (
        <Pressable
          onPress={handleExitDemo}
          style={[styles.signOutButton, { backgroundColor: theme.colors.surface }]}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="logout" size={iconSize.md} color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ color: theme.colors.primary }}>
            {tDemo('profile.exitDemo')}
          </Text>
        </Pressable>
      )}
      {user && !isDemoMode && (
        <Pressable
          onPress={handleSignOut}
          style={[styles.signOutButton, { backgroundColor: theme.colors.surface }]}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="logout" size={iconSize.md} color={theme.colors.error} />
          <Text variant="bodyLarge" style={{ color: theme.colors.error }}>
            {t('menu.signOut')}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

// ——— Reusable menu item ———

interface MenuItemProps {
  icon: string;
  label: string;
  badge?: number;
  onPress: () => void;
}

function MenuItem({ icon, label, badge, onPress }: MenuItemProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
      accessibilityRole="button"
    >
      <MaterialCommunityIcons
        name={icon as 'map-marker'}
        size={iconSize.md}
        color={theme.colors.primary}
      />
      <Text variant="bodyLarge" style={[styles.menuLabel, { color: theme.colors.onSurface }]}>
        {label}
      </Text>
      {badge !== undefined && badge > 0 && <Badge style={styles.badge}>{badge}</Badge>}
      <MaterialCommunityIcons
        name="chevron-right"
        size={iconSize.md}
        color={theme.colors.onSurfaceVariant}
      />
    </Pressable>
  );
}

// ——— Styles ———

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xl,
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
  appearanceSection: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    gap: spacing.md,
  },
  appearanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  segmentedButtons: {
    marginTop: spacing.xs,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
});
