import { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius, iconSize } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { CachedListThumbnail } from '@/shared/components/CachedListThumbnail';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import { ItemStatus } from '@/shared/types';
import { getItemThumbnailPublicUrl } from '@/features/inventory';
import type { ConversationListItem } from '../../types';

interface ItemContextStripProps {
  conversation: ConversationListItem;
  onPress?: () => void;
}

type ContextKey = 'borrowAccepted' | 'donationAccepted' | 'saleAccepted' | 'stored' | undefined;

function deriveContextKey(status: string | undefined): ContextKey {
  switch (status) {
    case ItemStatus.Loaned:
    case ItemStatus.Reserved:
      return 'borrowAccepted';
    case ItemStatus.Donated:
      return 'donationAccepted';
    case ItemStatus.Sold:
      return 'saleAccepted';
    case ItemStatus.Stored:
    case ItemStatus.Mounted:
      return 'stored';
    default:
      return undefined;
  }
}

type StatusTone = 'warning' | 'success' | 'neutral';

function deriveStatusTone(status: string | undefined): StatusTone | undefined {
  switch (status) {
    case ItemStatus.Loaned:
    case ItemStatus.Reserved:
      return 'warning';
    case ItemStatus.Donated:
    case ItemStatus.Sold:
      return 'success';
    default:
      return undefined;
  }
}

export function ItemContextStrip({ conversation, onPress }: ItemContextStripProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('messages');
  const { t: tInventory } = useTranslation('inventory');

  const themed = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.customColors.surfaceContainer,
          borderBottomColor: theme.colors.outlineVariant,
        },
        thumbnailFallback: {
          backgroundColor: theme.customColors.surfaceContainerHighest,
        },
        itemName: {
          color: theme.colors.onSurface,
          fontWeight: '700',
        },
        contextStamp: {
          color: theme.colors.onSurfaceVariant,
        },
        groupChipBg: {
          backgroundColor: theme.customColors.accentTint,
        },
        groupChipText: {
          color: theme.customColors.accent,
        },
      }),
    [theme],
  );

  if (!conversation.itemId || !conversation.itemName) {
    return null;
  }

  const contextKey = deriveContextKey(conversation.itemStatus);
  const statusTone = deriveStatusTone(conversation.itemStatus);
  const thumbnailUri = getItemThumbnailPublicUrl(conversation.itemPhotoPath);

  const statusColor =
    statusTone === 'warning'
      ? theme.customColors.warning
      : statusTone === 'success'
        ? theme.customColors.success
        : undefined;

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? t('detail.viewItem') : undefined}
      style={[styles.container, themed.container]}
      testID="item-context-strip"
    >
      <View style={[styles.thumbnail, themed.thumbnailFallback]}>
        {thumbnailUri ? (
          <CachedListThumbnail
            uri={thumbnailUri}
            cacheKey={conversation.itemPhotoPath}
            style={styles.thumbnailImage}
          />
        ) : (
          <MaterialCommunityIcons
            name="bicycle"
            size={iconSize.sm}
            color={theme.colors.onSurfaceVariant}
          />
        )}
      </View>

      <View style={styles.body}>
        <Text variant="bodyMedium" numberOfLines={1} style={themed.itemName}>
          {conversation.itemName}
        </Text>
        {contextKey ? (
          <Text
            variant="labelSmall"
            numberOfLines={1}
            style={[styles.contextStamp, themed.contextStamp]}
          >
            {t(`chat.context.${contextKey}`)}
          </Text>
        ) : null}
      </View>

      <View style={styles.tail}>
        {statusColor ? (
          <View style={[styles.statusChip, { backgroundColor: colorWithAlpha(statusColor, 0.2) }]}>
            <Text variant="labelSmall" style={{ color: statusColor }}>
              {tInventory(`status.${conversation.itemStatus}`)}
            </Text>
          </View>
        ) : null}
        {conversation.itemGroupId && conversation.groupName ? (
          <View style={[styles.groupChip, themed.groupChipBg]}>
            <Text variant="labelSmall" style={themed.groupChipText} numberOfLines={1}>
              {t('chat.context.groupAffiliation', { name: conversation.groupName })}
            </Text>
          </View>
        ) : null}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  contextStamp: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  tail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    height: 22,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
  },
  groupChip: {
    paddingHorizontal: spacing.sm,
    height: 22,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    maxWidth: 140,
  },
});
