import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { Text, Avatar, Appbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '@/shared/api/supabase';
import { LoadingScreen, ReportDialog } from '@/shared/components';
import type { ReportReason } from '@/shared/components';
import { useReport } from '@/shared/hooks/useReport';
import { useAuth } from '@/features/auth';
import { spacing, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import type { UserId, ItemId } from '@/shared/types';
import type { ItemCategory, ItemCondition, AvailabilityType } from '@/shared/types';
import { useUserRatings } from '@/features/ratings/hooks/useUserRatings';
import { ReviewCard } from '@/features/ratings/components/ReviewCard/ReviewCard';

/** Minimal public profile data fetched from the profiles table. */
interface PublicProfile {
  id: UserId;
  displayName: string | undefined;
  avatarUrl: string | undefined;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
}

/** Minimal public listing data for display. */
interface PublicListing {
  id: ItemId;
  name: string;
  category: ItemCategory;
  condition: ItemCondition;
  availabilityTypes: AvailabilityType[];
  price: number | undefined;
  createdAt: string;
}

export default function PublicUserProfileScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('ratings');
  const { t: tProfile } = useTranslation('profile');
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const [reportVisible, setReportVisible] = useState(false);
  const reportMutation = useReport();

  // Fetch public profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['publicProfile', userId],
    queryFn: async (): Promise<PublicProfile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, rating_avg, rating_count, created_at')
        .eq('id', userId!)
        .single();

      if (error) throw error;

      return {
        id: data.id as string as UserId,
        displayName: (data.display_name as string) ?? undefined,
        avatarUrl: (data.avatar_url as string) ?? undefined,
        ratingAvg: (data.rating_avg as number) ?? 0,
        ratingCount: (data.rating_count as number) ?? 0,
        createdAt: data.created_at as string,
      };
    },
    enabled: !!userId,
  });

  // Fetch public listings (visible items owned by this user)
  const { data: listings } = useQuery({
    queryKey: ['publicListings', userId],
    queryFn: async (): Promise<PublicListing[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, category, condition, availability_types, price, created_at')
        .eq('owner_id', userId!)
        .eq('visibility', 'public')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id as string as ItemId,
        name: row.name as string,
        category: row.category as ItemCategory,
        condition: row.condition as ItemCondition,
        availabilityTypes: (row.availability_types ?? []) as AvailabilityType[],
        price: (row.price as number) ?? undefined,
        createdAt: row.created_at as string,
      }));
    },
    enabled: !!userId,
  });

  // Fetch ratings/reviews
  const { data: ratings } = useUserRatings(userId as string as UserId);

  if (profileLoading || !profile) {
    return <LoadingScreen />;
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
        <Appbar.BackAction onPress={() => router.back()} />
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
                onPress={() => router.push(`/(tabs)/search/${listing.id}` as never)}
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
