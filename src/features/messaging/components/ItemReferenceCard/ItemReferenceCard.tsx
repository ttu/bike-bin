import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import type { ConversationListItem } from '../../types';

interface ItemReferenceCardProps {
  conversation: ConversationListItem;
  onViewItem?: () => void;
}

export function ItemReferenceCard({ conversation, onViewItem }: ItemReferenceCardProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('messages');

  if (!conversation.itemId || !conversation.itemName) {
    return null;
  }

  // Determine availability text
  const availabilityText = conversation.itemAvailabilityTypes?.length
    ? conversation.itemAvailabilityTypes
        .map((type) => t(`detail.itemAvailability.${type}`))
        .join(' · ')
    : '';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceVariant,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      {/* Item thumbnail placeholder */}
      <View style={[styles.thumbnail, { backgroundColor: theme.colors.surface }]}>
        <MaterialCommunityIcons
          name="bicycle"
          size={iconSize.md}
          color={theme.colors.onSurfaceVariant}
        />
      </View>

      {/* Item info */}
      <View style={styles.info}>
        <Text variant="titleSmall" numberOfLines={1} style={{ color: theme.colors.onSurface }}>
          {conversation.itemName}
        </Text>
        {availabilityText ? (
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {availabilityText}
          </Text>
        ) : null}
      </View>

      {/* View link */}
      <Pressable
        onPress={onViewItem}
        style={styles.viewLink}
        accessibilityLabel={t('detail.viewItem')}
        accessibilityRole="link"
      >
        <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
          {t('detail.viewItem')}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={iconSize.sm}
          color={theme.colors.primary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
