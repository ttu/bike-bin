import { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { Text, Avatar, Appbar, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LoadingScreen, ReportDialog } from '@/shared/components';
import type { ReportReason } from '@/shared/components';
import { useReport } from '@/shared/hooks/useReport';
import { useAuth } from '@/features/auth';
import { spacing, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import type { UserId } from '@/shared/types';
import {
  decodeReturnPathParam,
  encodeReturnPath,
  isSafeTabReturnPath,
} from '@/shared/utils/returnPath';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { usePublicProfile, usePublicListings } from '@/features/profile';
import { useUserRatings } from '@/features/ratings/hooks/useUserRatings';
import { ReviewCard } from '@/features/ratings/components/ReviewCard/ReviewCard';

export default function PublicUserProfileScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('ratings');
  const { t: tProfile } = useTranslation('profile');
  const router = useRouter();
  const { userId, returnPath } = useLocalSearchParams<{ userId: string; returnPath?: string }>();

  const handleBack = useCallback(() => {
    const decoded = decodeReturnPathParam(returnPath);
    if (decoded && isSafeTabReturnPath(decoded)) {
      router.replace(decoded as Href);
      return;
    }
    tabScopedBack('/(tabs)/profile');
  }, [returnPath, router]);
  const { user } = useAuth();
  const [reportVisible, setReportVisible] = useState(false);
  const reportMutation = useReport();

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
    isFetching: profileFetching,
  } = usePublicProfile(userId);
  const { data: listings } = usePublicListings(userId);
  const { data: ratings } = useUserRatings(userId as string as UserId);

  if (profileLoading) {
    return <LoadingScreen />;
  }

  if (profileError || !profile) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.BackAction onPress={handleBack} />
          <Appbar.Content title={tProfile('publicProfile.notFoundTitle')} />
        </Appbar.Header>
        <View style={styles.notFoundBody}>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
          >
            {tProfile('publicProfile.notFoundMessage')}
          </Text>
          <Button mode="contained" onPress={() => void refetchProfile()} loading={profileFetching}>
            {tProfile('publicProfile.retry')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const formattedRating = profile.ratingCount > 0 ? profile.ratingAvg.toFixed(1) : '—';

  const handleReportSubmit = (reason: ReportReason, text: string | undefined) => {
    if (!user) return;
    reportMutation.mutate(
      {
        reporterId: user.id as string as UserId,
        targetType: 'user',
        targetId: userId!,
        reason,
        text,
      },
      {
        onSuccess: () => {
          setReportVisible(false);
          Alert.alert(tProfile('report.successTitle'), tProfile('report.successMessage'));
        },
        onError: () => {
          Alert.alert(tProfile('report.errorTitle'), tProfile('report.errorMessage'));
        },
      },
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={handleBack} />
        <Appbar.Content title="" />
        <Appbar.Action
          icon="flag-outline"
          onPress={() => setReportVisible(true)}
          accessibilityLabel={t('profile.report')}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {profile.avatarUrl ? (
            <Avatar.Image size={80} source={{ uri: profile.avatarUrl }} />
          ) : (
            <Avatar.Icon
              size={80}
              icon="account"
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            />
          )}
          <Text
            variant="headlineSmall"
            style={[styles.displayName, { color: theme.colors.onSurface }]}
          >
            {profile.displayName ?? '—'}
          </Text>

          {/* Rating summary */}
          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={iconSize.md} color={theme.colors.primary} />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {formattedRating}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {' '}
              ({t('profile.ratingCount', { count: profile.ratingCount })})
            </Text>
          </View>
        </View>

        {/* Recent Reviews */}
        <View style={styles.section}>
          <Text
            variant="titleLarge"
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            {t('profile.reviews')}
          </Text>

          {ratings && ratings.length > 0 ? (
            ratings.map((rating) => (
              <ReviewCard
                key={rating.id}
                reviewerName={rating.reviewer.displayName}
                score={rating.score}
                text={rating.text}
                transactionType={rating.transactionType}
                createdAt={rating.createdAt}
              />
            ))
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('profile.noReviews')}
            </Text>
          )}
        </View>

        {/* Public Listings */}
        <View style={styles.section}>
          <Text
            variant="titleLarge"
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            {t('profile.publicListings')}
          </Text>

          {listings && listings.length > 0 ? (
            listings.map((listing) => (
              <Pressable
                key={listing.id}
                style={[styles.listingCard, { backgroundColor: theme.colors.surfaceVariant }]}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/search/[id]',
                    params: {
                      id: listing.id,
                      returnPath: encodeReturnPath(`/(tabs)/profile/${userId}`),
                    },
                  })
                }
                accessibilityRole="button"
              >
                <View style={styles.listingContent}>
                  <Text
                    variant="titleSmall"
                    style={{ color: theme.colors.onSurface }}
                    numberOfLines={1}
                  >
                    {listing.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {listing.category} · {listing.condition}
                  </Text>
                  {listing.availabilityTypes.length > 0 && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {listing.availabilityTypes.join(', ')}
                    </Text>
                  )}
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={iconSize.md}
                  color={theme.colors.onSurfaceVariant}
                />
              </Pressable>
            ))
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('profile.noListings')}
            </Text>
          )}
        </View>
      </ScrollView>

      <ReportDialog
        visible={reportVisible}
        onDismiss={() => setReportVisible(false)}
        onSubmit={handleReportSubmit}
        loading={reportMutation.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  notFoundBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.md,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  displayName: {
    marginTop: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  listingContent: {
    flex: 1,
    gap: 2,
  },
});
