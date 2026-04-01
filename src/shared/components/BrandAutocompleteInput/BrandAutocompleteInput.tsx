import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';
import { spacing, borderRadius } from '@/shared/theme';

export interface BrandAutocompleteInputProps {
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  placeholder: string;
  value: string;
  filteredBrands: string[];
  menuVisible: boolean;
  onChangeText: (text: string) => void;
  onSelectBrand: (brand: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  softInputStyle: StyleProp<TextStyle>;
  underlineColor: string;
  activeUnderlineColor: string;
}

export function BrandAutocompleteInput({
  label,
  labelStyle,
  placeholder,
  value,
  filteredBrands,
  menuVisible,
  onChangeText,
  onSelectBrand,
  onFocus,
  onBlur,
  softInputStyle,
  underlineColor,
  activeUnderlineColor,
}: BrandAutocompleteInputProps) {
  const theme = useTheme<AppTheme>();

  return (
    <>
      <Text variant="labelLarge" style={[styles.label, labelStyle]}>
        {label}
      </Text>
      <View style={styles.autocompleteWrapper}>
        <TextInput
          mode="flat"
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          style={softInputStyle}
          underlineColor={underlineColor}
          activeUnderlineColor={activeUnderlineColor}
        />
        {menuVisible && filteredBrands.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface }]}>
            <ScrollView
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {filteredBrands.slice(0, 8).map((b) => (
                <Pressable
                  key={b}
                  onPress={() => onSelectBrand(b)}
                  style={({ pressed }) => [
                    styles.suggestionItem,
                    pressed && { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Text variant="bodyMedium">{b}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  autocompleteWrapper: {
    zIndex: 10,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    borderRadius: borderRadius.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
});
