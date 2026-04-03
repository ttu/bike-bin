import { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Avatar, useTheme } from 'react-native-paper';
import { CachedAvatarImage } from '@/shared/components/CachedAvatarImage';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import type { UserProfile } from '@/shared/types';

interface ProfileHeaderProps {
  profile: Pick<
    UserProfile,
    'displayName' | 'avatarUrl' | 'ratingAvg' | 'ratingCount' | 'createdAt'
  >;
  onEditPress?: () => void;
}

/**
 * Displays the current user's avatar, display name, rating summary,
 * member-since date, and an edit-profile link.
 */
export function ProfileHeader({ profile, onEditPress }: ProfileHeaderProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('profile');
  const themed = useThemedStyles(theme);

  const formattedRating = profile.ratingCount > 0 ? profile.ratingAvg.toFixed(1) : '—';
  const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {profile.avatarUrl ? (
          <CachedAvatarImage uri={profile.avatarUrl} size={64} />
        ) : (
          <Avatar.Icon size={64} icon="account" style={themed.avatarBg} />
        )}

        <View style={styles.info}>
          <Text variant="titleLarge" style={themed.onSurface} numberOfLines={1}>
            {profile.displayName ?? '—'}
          </Text>

          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={iconSize.sm} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={themed.onSurface}>
              {formattedRating}
            </Text>
            <Text variant="bodySmall" style={themed.onSurfaceVariant}>
              ({profile.ratingCount})
            </Text>
          </View>

          <Text variant="bodySmall" style={themed.onSurfaceVariant}>
            {t('header.memberSince', { date: memberSince })}
          </Text>
        </View>
      </View>

      {onEditPress && (
        <Pressable
          onPress={onEditPress}
          style={styles.editLink}
          accessibilityRole="button"
          accessibilityLabel={t('header.editProfile')}
        >
          <Text variant="labelLarge" style={themed.primary}>
            {t('header.editProfile')}
          </Text>
          <MaterialCommunityIcons
            name="pencil-outline"
            size={iconSize.sm}
            color={theme.colors.primary}
          />
        </Pressable>
      )}
    </View>
  );
}

function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onSurface: { color: theme.colors.onSurface },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        primary: { color: theme.colors.primary },
        avatarBg: { backgroundColor: theme.colors.surfaceVariant },
      }),
    [theme],
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
});
