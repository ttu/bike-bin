import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';

export interface BrandAutocompleteInputProps {
  readonly label: string;
  readonly labelStyle?: StyleProp<TextStyle>;
  readonly placeholder: string;
  readonly value: string;
  readonly filteredBrands: string[];
  readonly menuVisible: boolean;
  readonly onChangeText: (text: string) => void;
  readonly onSelectBrand: (brand: string) => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onSuggestionPressIn?: () => void;
  readonly softInputStyle: StyleProp<TextStyle>;
  readonly underlineColor: string;
  readonly activeUnderlineColor: string;
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
  onSuggestionPressIn,
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
                  onPressIn={onSuggestionPressIn}
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
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      default: {},
    }),
    elevation: 4,
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
