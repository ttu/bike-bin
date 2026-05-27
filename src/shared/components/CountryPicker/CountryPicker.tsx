import { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { COUNTRIES } from '@/shared/data/countries';
import { countryFlag } from '@/shared/utils/countryFlag';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';

export interface CountryPickerProps {
  readonly value: string;
  readonly onChange: (code: string) => void;
  readonly label: string;
  readonly error?: boolean;
}

export function CountryPicker({ value, onChange, label, error }: CountryPickerProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('locations');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        trigger: {
          backgroundColor: theme.customColors.surfaceContainerHighest,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: error
            ? theme.colors.error
            : colorWithAlpha(theme.colors.outlineVariant, 0.5),
        },
        triggerLabel: {
          color: error ? theme.colors.error : theme.colors.onSurfaceVariant,
          marginBottom: spacing.xs,
        },
        triggerValue: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        triggerValueText: {
          color: theme.colors.onSurface,
        },
        modal: {
          backgroundColor: theme.colors.surface,
          margin: spacing.lg,
          borderRadius: borderRadius.md,
          padding: spacing.base,
          maxHeight: '80%',
        },
        searchInput: {
          backgroundColor: theme.customColors.surfaceContainerHighest,
          borderRadius: borderRadius.md,
          marginBottom: spacing.sm,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.xs,
          gap: spacing.sm,
        },
        rowName: { flex: 1, color: theme.colors.onSurface },
        rowCode: { color: theme.colors.onSurfaceVariant },
      }),
    [theme, error],
  );

  const underlineColor = colorWithAlpha(theme.colors.outlineVariant, 0.15);
  const activeUnderlineColor = theme.colors.primary;

  const selected = COUNTRIES.find((c) => c.code === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.startsWith(q),
    );
  }, [query]);

  const handleSelect = useCallback(
    (code: string) => {
      onChange(code);
      setOpen(false);
      setQuery('');
    },
    [onChange],
  );

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={styles.trigger}
      >
        <Text variant="bodySmall" style={styles.triggerLabel}>
          {label}
        </Text>
        <View style={styles.triggerValue}>
          {selected && !open ? (
            <>
              <Text variant="bodyLarge">{countryFlag(selected.code)}</Text>
              <Text variant="bodyLarge" style={styles.triggerValueText}>
                {selected.name}
              </Text>
            </>
          ) : null}
        </View>
      </Pressable>

      <Portal>
        <Modal
          visible={open}
          onDismiss={() => setOpen(false)}
          contentContainerStyle={styles.modal}
        >
          {open ? (
            <>
              <TextInput
                mode="flat"
                placeholder={t('form.countrySearchPlaceholder')}
                value={query}
                onChangeText={setQuery}
                autoFocus
                style={styles.searchInput}
                underlineColor={underlineColor}
                activeUnderlineColor={activeUnderlineColor}
              />
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.code}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelect(item.code)}
                    accessibilityRole="button"
                  >
                    <View style={styles.row}>
                      <Text variant="bodyLarge">{countryFlag(item.code)}</Text>
                      <Text variant="bodyMedium" style={styles.rowName}>
                        {item.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.rowCode}>
                        {item.code.toUpperCase()}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            </>
          ) : null}
        </Modal>
      </Portal>
    </>
  );
}
