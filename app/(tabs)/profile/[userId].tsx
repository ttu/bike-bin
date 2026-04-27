import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, Avatar, Appbar, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LoadingScreen, ReportDialog, type ReportReason } from '@/shared/components';
import { CenteredLoadingIndicator } from '@/shared/components/CenteredLoadingIndicator/CenteredLoadingIndicator';
import { CachedAvatarImage } from '@/shared/components/CachedAvatarImage';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { useReport } from '@/shared/hooks/useReport';
import { useAuth } from '@/features/auth';
import { borderRadius, iconSize, spacing, type AppTheme } from '@/shared/theme';
import type { UserId } from '@/shared/types';
import { encodeReturnPath } from '@/shared/utils/returnPath';
import { useReturnNavigation } from '@/shared/hooks/useReturnNavigation';
import { usePublicProfile, usePublicListings } from '@/features/profile';
import { useUserRatings } from '@/features/ratings/hooks/useUserRatings';
import { ReviewCard } from '@/features/ratings/components/ReviewCard/ReviewCard';

export default function PublicUserProfileScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('ratings');
  const { t: tProfile } = useTranslation('profile');
  const router = useRouter();
  const { userId, returnPath } = useLocalSearchParams<{ userId: string; returnPath?: string }>();

  const handleBack = useReturnNavigation(returnPath, '/(tabs)/profile');
  const { user } = useAuth();
  const [reportVisible, setReportVisible] = useState(false);
  const reportMutation = useReport();
  const { showSnackbarAlert } = useSnackbarAlerts();

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
    isFetching: profileFetching,
  } = usePublicProfile(userId);
  const { data: listings, isLoading: listingsLoading } = usePublicListings(userId);
  const { data: ratings, isLoading: ratingsLoading } = useUserRatings(userId as string as UserId);

  if (profileLoading) {
    return <LoadingScreen />;
  }

  if (profileError || !profile) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.surface }}>
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
          <Button
            mode="contained"
            onPress={() => {
              refetchProfile();
            }}
            loading={profileFetching}
          >
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
          showSnackbarAlert({
            message: tProfile('report.successMessage'),
            variant: 'success',
          });
        },
        onError: () => {
          showSnackbarAlert({
            message: tProfile('report.errorMessage'),
            variant: 'error',
            duration: 'long',
          });
        },
      },
    );
  };

  const renderReviews = () => {
    if (ratingsLoading) return <CenteredLoadingIndicator fill={false} />;
    if (ratings && ratings.length > 0) {
      return ratings.map((rating) => (
        <ReviewCard
          key={rating.id}
          reviewerName={rating.reviewer.displayName}
          isDeletedReviewer={rating.fromUserId === undefined}
          score={rating.score}
          text={rating.text}
          transactionType={rating.transactionType}
          createdAt={rating.createdAt}
        />
      ));
    }
    return (
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('profile.noReviews')}
      </Text>
    );
  };

  const renderListings = () => {
    if (listingsLoading) return <CenteredLoadingIndicator fill={false} />;
    if (listings && listings.length > 0) {
      return listings.map((listing) => (
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
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }} numberOfLines={1}>
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
      ));
    }
    return (
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('profile.noListings')}
      </Text>
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.surface }}>
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
            <CachedAvatarImage uri={profile.avatarUrl} size={80} />
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

          {renderReviews()}
        </View>

        {/* Public Listings */}
        <View style={styles.section}>
          <Text
            variant="titleLarge"
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            {t('profile.publicListings')}
          </Text>

          {renderListings()}
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
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  listingContent: {
    flex: 1,
    gap: 2,
  },
});
