import { View, Pressable } from 'react-native';
import { Text, TextInput, Chip, HelperText, Menu, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';
import { AvailabilityType } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { DURATION_OPTIONS } from '../../../constants';
import type { InputStyling, ItemFormState } from '../types';
import { styles } from '../styles';

const AVAILABILITY_OPTIONS = [
  AvailabilityType.Private,
  AvailabilityType.Borrowable,
  AvailabilityType.Donatable,
  AvailabilityType.Sellable,
];

interface AvailabilitySectionProps extends InputStyling {
  availabilityTypes: ItemFormState['availabilityTypes'];
  toggleAvailability: ItemFormState['toggleAvailability'];
  isSellable: ItemFormState['isSellable'];
  isBorrowable: ItemFormState['isBorrowable'];
  price: ItemFormState['price'];
  setPrice: ItemFormState['setPrice'];
  deposit: ItemFormState['deposit'];
  setDeposit: ItemFormState['setDeposit'];
  borrowDuration: ItemFormState['borrowDuration'];
  setBorrowDuration: ItemFormState['setBorrowDuration'];
  durationMenuVisible: ItemFormState['durationMenuVisible'];
  setDurationMenuVisible: ItemFormState['setDurationMenuVisible'];
  errors: ItemFormState['errors'];
}

export function AvailabilitySection({
  availabilityTypes,
  toggleAvailability,
  isSellable,
  isBorrowable,
  price,
  setPrice,
  deposit,
  setDeposit,
  borrowDuration,
  setBorrowDuration,
  durationMenuVisible,
  setDurationMenuVisible,
  errors,
  softInputStyle,
  underlineColor,
  activeUnderlineColor,
}: AvailabilitySectionProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');

  return (
    <>
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.availabilityLabel')}
      </Text>
      <View style={styles.chipRow}>
        {AVAILABILITY_OPTIONS.map((type) => (
          <Chip
            key={type}
            selected={availabilityTypes.includes(type)}
            onPress={() => toggleAvailability(type)}
            showSelectedCheck={false}
            textStyle={
              availabilityTypes.includes(type) ? { color: theme.colors.onPrimary } : undefined
            }
            style={[
              styles.chip,
              {
                backgroundColor: availabilityTypes.includes(type)
                  ? theme.colors.primary
                  : theme.colors.secondaryContainer,
              },
            ]}
          >
            {t(`availability.${type}`)}
          </Chip>
        ))}
      </View>

      {isSellable && (
        <>
          <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
            {t('form.priceLabel')}
          </Text>
          <TextInput
            mode="flat"
            value={price}
            onChangeText={setPrice}
            placeholder={t('form.pricePlaceholder')}
            keyboardType="decimal-pad"
            error={!!errors.price}
            style={softInputStyle}
            underlineColor={underlineColor}
            activeUnderlineColor={activeUnderlineColor}
          />
          {errors.price && (
            <HelperText type="error" visible>
              {errors.price}
            </HelperText>
          )}
        </>
      )}

      {isBorrowable && (
        <>
          <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
            {t('form.depositLabel')}
          </Text>
          <TextInput
            mode="flat"
            value={deposit}
            onChangeText={setDeposit}
            placeholder={t('form.depositPlaceholder')}
            keyboardType="decimal-pad"
            style={softInputStyle}
            underlineColor={underlineColor}
            activeUnderlineColor={activeUnderlineColor}
          />

          <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
            {t('form.durationLabel')}
          </Text>
          <Menu
            visible={durationMenuVisible}
            onDismiss={() => setDurationMenuVisible(false)}
            anchor={
              <Pressable onPress={() => setDurationMenuVisible(true)}>
                <TextInput
                  mode="flat"
                  value={
                    borrowDuration
                      ? t(`form.durationOption.${borrowDuration}`, {
                          defaultValue: borrowDuration,
                        })
                      : ''
                  }
                  editable={false}
                  placeholder={t('form.durationPlaceholder')}
                  right={<TextInput.Icon icon="chevron-down" />}
                  style={[softInputStyle, { pointerEvents: 'none' }]}
                  underlineColor={underlineColor}
                  activeUnderlineColor={activeUnderlineColor}
                />
              </Pressable>
            }
          >
            {DURATION_OPTIONS.map((opt) => (
              <Menu.Item
                key={opt}
                title={t(`form.durationOption.${opt}`)}
                onPress={() => {
                  setBorrowDuration(opt);
                  setDurationMenuVisible(false);
                }}
              />
            ))}
          </Menu>
        </>
      )}
    </>
  );
}
