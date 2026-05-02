import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { ItemStatus, type Item } from '@/shared/types';
import { GradientButton } from '@/shared/components/GradientButton';
import { ActionSlot, styles, type TFn } from '../shared';

export function ActionsSection({
  item,
  isWide,
  t,
  canShowReturnedAction,
  canShowDonateAction,
  canShowSoldAction,
  canShowLoanAction,
  onMarkReturned,
  onMarkDonated,
  onMarkSold,
  onMarkLoaned,
  onUnarchive,
  onRemoveFromBin,
  markReturnedLoading,
}: {
  readonly item: Item;
  readonly isWide: boolean;
  readonly t: TFn;
  readonly canShowReturnedAction: boolean;
  readonly canShowDonateAction: boolean;
  readonly canShowSoldAction: boolean;
  readonly canShowLoanAction: boolean;
  readonly onMarkReturned?: () => void;
  readonly onMarkDonated?: () => void;
  readonly onMarkSold?: () => void;
  readonly onMarkLoaned?: () => void;
  readonly onUnarchive?: () => void;
  readonly onRemoveFromBin?: () => void;
  readonly markReturnedLoading: boolean;
}) {
  const hasActions =
    (canShowReturnedAction && !!onMarkReturned) ||
    (canShowDonateAction && !!onMarkDonated) ||
    (canShowSoldAction && !!onMarkSold) ||
    (canShowLoanAction && !!onMarkLoaned) ||
    (item.status === ItemStatus.Archived && !!onUnarchive) ||
    !!onRemoveFromBin;
  if (!hasActions) return null;
  return (
    <View style={[styles.actionSection, isWide && styles.actionSectionWide]}>
      {canShowReturnedAction && onMarkReturned && (
        <ActionSlot isWide={isWide}>
          <GradientButton
            onPress={onMarkReturned}
            loading={markReturnedLoading}
            style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
          >
            {t('detail.markReturned')}
          </GradientButton>
        </ActionSlot>
      )}
      {canShowDonateAction && onMarkDonated && (
        <ActionSlot isWide={isWide}>
          <Button
            mode="outlined"
            onPress={onMarkDonated}
            style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
          >
            {t('detail.markDonated')}
          </Button>
        </ActionSlot>
      )}
      {canShowSoldAction && onMarkSold && (
        <ActionSlot isWide={isWide}>
          <Button
            mode="outlined"
            onPress={onMarkSold}
            style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
          >
            {t('detail.markSold')}
          </Button>
        </ActionSlot>
      )}
      {canShowLoanAction && onMarkLoaned && (
        <ActionSlot isWide={isWide}>
          <Button
            mode="outlined"
            onPress={onMarkLoaned}
            style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
          >
            {t('detail.markLoaned')}
          </Button>
        </ActionSlot>
      )}
      {item.status === ItemStatus.Archived && onUnarchive && (
        <ActionSlot isWide={isWide}>
          <GradientButton
            onPress={onUnarchive}
            style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
          >
            {t('detail.unarchive')}
          </GradientButton>
        </ActionSlot>
      )}
      {onRemoveFromBin && (
        <ActionSlot isWide={isWide}>
          <Button
            mode="outlined"
            onPress={onRemoveFromBin}
            style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
          >
            {t('removeFromInventory')}
          </Button>
        </ActionSlot>
      )}
    </View>
  );
}
