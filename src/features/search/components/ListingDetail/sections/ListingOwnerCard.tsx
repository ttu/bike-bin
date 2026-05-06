import { View } from 'react-native';
import { Text, Avatar, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { CachedAvatarImage } from '@/shared/components/CachedAvatarImage';
import { type AppTheme } from '@/shared/theme';
import type { SearchResultItem } from '../../../types';
import { styles, useThemedStyles } from '../shared';

export function ListingOwnerCard({
  item,
  onOwnerPress,
}: {
  readonly item: SearchResultItem;
  readonly onOwnerPress?: () => void;
}) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation(['search']);
  const themed = useThemedStyles();
  return (
    <View style={[styles.section, themed.sectionBorder]}>
      <View style={[styles.ownerCard, themed.ownerCardBackground]}>
        {item.ownerAvatarUrl ? (
          <CachedAvatarImage testID="owner-avatar-image" uri={item.ownerAvatarUrl} size={40} />
        ) : (
          <Avatar.Icon
            testID="owner-avatar-icon"
            size={40}
            icon="account"
            style={themed.avatarBg}
          />
        )}
        <View style={styles.ownerInfo}>
          <Text variant="titleSmall" style={themed.onBackground} onPress={onOwnerPress}>
            {item.ownerDisplayName ?? ''}
          </Text>
          {item.ownerRatingCount > 0 && (
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={14} color={theme.customColors.warning} />
              <Text variant="bodySmall" style={themed.onSurfaceVariant}>
                {t('search:listing.ownerCard.rating', {
                  avg: item.ownerRatingAvg.toFixed(1),
                  count: item.ownerRatingCount,
                })}
              </Text>
            </View>
          )}
        </View>
        {onOwnerPress && (
          <Text variant="labelSmall" style={themed.primary} onPress={onOwnerPress}>
            {t('search:listing.ownerCard.viewProfile')}
          </Text>
        )}
      </View>
    </View>
  );
}
