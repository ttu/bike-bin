import { View } from 'react-native';
import { Button } from 'react-native-paper';
import { GradientButton } from '@/shared/components/GradientButton';
import { ActionSlot, styles, type TFn } from '../shared';

export function ListingActions({
  isAuthenticated,
  isWide,
  showContactOnly,
  showBorrowOnly,
  showBoth,
  onContact,
  onRequestBorrow,
  t,
}: {
  readonly isAuthenticated: boolean;
  readonly isWide: boolean;
  readonly showContactOnly: boolean;
  readonly showBorrowOnly: boolean;
  readonly showBoth: boolean;
  readonly onContact?: () => void;
  readonly onRequestBorrow?: () => void;
  readonly t: TFn;
}) {
  return (
    <View style={[styles.actionSection, isWide && styles.actionSectionWide]}>
      {isAuthenticated ? (
        <>
          {(showContactOnly || showBoth) && onContact && (
            <ActionSlot isWide={isWide}>
              <GradientButton
                onPress={onContact}
                style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
              >
                {t('search:listing.actions.contact')}
              </GradientButton>
            </ActionSlot>
          )}
          {showBorrowOnly && onRequestBorrow && (
            <ActionSlot isWide={isWide}>
              <GradientButton
                onPress={onRequestBorrow}
                style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
              >
                {t('search:listing.actions.requestBorrow')}
              </GradientButton>
            </ActionSlot>
          )}
          {showBoth && onRequestBorrow && (
            <ActionSlot isWide={isWide}>
              <Button
                mode="outlined"
                onPress={onRequestBorrow}
                style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
              >
                {t('search:listing.actions.requestBorrow')}
              </Button>
            </ActionSlot>
          )}
        </>
      ) : (
        <ActionSlot isWide={isWide} fullWidth>
          <GradientButton
            disabled
            style={[styles.actionButton, isWide && styles.actionButtonInGrid]}
          >
            {t('search:listing.actions.signInToContact')}
          </GradientButton>
        </ActionSlot>
      )}
    </View>
  );
}
