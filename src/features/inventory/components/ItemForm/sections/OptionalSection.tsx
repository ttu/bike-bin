import { useRef, useCallback, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text, TextInput, Chip, Button, Menu, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';
import { ItemCategory } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { AGE_OPTIONS } from '../../../constants';
import type { InputStyling, ItemFormState } from '../types';
import { styles } from '../styles';

interface OptionalSectionProps extends InputStyling {
  showOptional: ItemFormState['showOptional'];
  setShowOptional: ItemFormState['setShowOptional'];
  category: ItemFormState['category'];
  // Age
  age: ItemFormState['age'];
  setAge: ItemFormState['setAge'];
  ageMenuVisible: ItemFormState['ageMenuVisible'];
  setAgeMenuVisible: ItemFormState['setAgeMenuVisible'];
  // Usage
  usage: ItemFormState['usage'];
  setUsage: ItemFormState['setUsage'];
  distanceUnit: ItemFormState['distanceUnit'];
  // Storage
  storageLocation: ItemFormState['storageLocation'];
  setStorageLocation: ItemFormState['setStorageLocation'];
  storageMenuVisible: ItemFormState['storageMenuVisible'];
  setStorageMenuVisible: ItemFormState['setStorageMenuVisible'];
  existingStorageLocations: ItemFormState['existingStorageLocations'];
  // Description
  description: ItemFormState['description'];
  setDescription: ItemFormState['setDescription'];
  // Tags
  tags: ItemFormState['tags'];
  tagInput: ItemFormState['tagInput'];
  setTagInput: ItemFormState['setTagInput'];
  tagSuggestionsVisible: ItemFormState['tagSuggestionsVisible'];
  setTagSuggestionsVisible: ItemFormState['setTagSuggestionsVisible'];
  filteredTagSuggestions: ItemFormState['filteredTagSuggestions'];
  handleAddTag: ItemFormState['handleAddTag'];
  handleRemoveTag: ItemFormState['handleRemoveTag'];
  clearTagBlurCommitTimeout: ItemFormState['clearTagBlurCommitTimeout'];
  tagBlurCommitTimeoutRef: ItemFormState['tagBlurCommitTimeoutRef'];
}

export function OptionalSection({
  showOptional,
  setShowOptional,
  category,
  age,
  setAge,
  ageMenuVisible,
  setAgeMenuVisible,
  usage,
  setUsage,
  distanceUnit,
  storageLocation,
  setStorageLocation,
  storageMenuVisible,
  setStorageMenuVisible,
  existingStorageLocations,
  description,
  setDescription,
  tags,
  tagInput,
  setTagInput,
  tagSuggestionsVisible,
  setTagSuggestionsVisible,
  filteredTagSuggestions,
  handleAddTag,
  handleRemoveTag,
  clearTagBlurCommitTimeout,
  tagBlurCommitTimeoutRef,
  softInputStyle,
  underlineColor,
  activeUnderlineColor,
}: OptionalSectionProps) {
  const { t } = useTranslation('inventory');

  return (
    <>
      <Button
        mode="text"
        onPress={() => setShowOptional(!showOptional)}
        icon={showOptional ? 'chevron-up' : 'chevron-down'}
        style={styles.optionalToggle}
      >
        {t('form.optionalSection')}
      </Button>

      {showOptional && (
        <View style={styles.optionalSection}>
          <AgeField
            age={age}
            setAge={setAge}
            ageMenuVisible={ageMenuVisible}
            setAgeMenuVisible={setAgeMenuVisible}
            softInputStyle={softInputStyle}
            underlineColor={underlineColor}
            activeUnderlineColor={activeUnderlineColor}
          />
          {(category === ItemCategory.Component || category === ItemCategory.Accessory) && (
            <UsageField
              usage={usage}
              setUsage={setUsage}
              distanceUnit={distanceUnit}
              softInputStyle={softInputStyle}
              underlineColor={underlineColor}
              activeUnderlineColor={activeUnderlineColor}
            />
          )}
          <StorageField
            storageLocation={storageLocation}
            setStorageLocation={setStorageLocation}
            storageMenuVisible={storageMenuVisible}
            setStorageMenuVisible={setStorageMenuVisible}
            existingStorageLocations={existingStorageLocations}
            softInputStyle={softInputStyle}
            underlineColor={underlineColor}
            activeUnderlineColor={activeUnderlineColor}
          />
          <DescriptionField
            description={description}
            setDescription={setDescription}
            softInputStyle={softInputStyle}
            underlineColor={underlineColor}
            activeUnderlineColor={activeUnderlineColor}
          />
          <TagsField
            tags={tags}
            tagInput={tagInput}
            setTagInput={setTagInput}
            tagSuggestionsVisible={tagSuggestionsVisible}
            setTagSuggestionsVisible={setTagSuggestionsVisible}
            filteredTagSuggestions={filteredTagSuggestions}
            handleAddTag={handleAddTag}
            handleRemoveTag={handleRemoveTag}
            clearTagBlurCommitTimeout={clearTagBlurCommitTimeout}
            tagBlurCommitTimeoutRef={tagBlurCommitTimeoutRef}
            softInputStyle={softInputStyle}
            underlineColor={underlineColor}
            activeUnderlineColor={activeUnderlineColor}
          />
        </View>
      )}
    </>
  );
}

// ── Sub-fields (private to this module) ────────────────────────

interface AgeFieldProps extends InputStyling {
  age: string;
  setAge: (v: string) => void;
  ageMenuVisible: boolean;
  setAgeMenuVisible: (v: boolean) => void;
}

function AgeField({
  age,
  setAge,
  ageMenuVisible,
  setAgeMenuVisible,
  softInputStyle,
  underlineColor,
  activeUnderlineColor,
}: AgeFieldProps) {
  const { t } = useTranslation('inventory');

  return (
    <>
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.ageLabel')}
      </Text>
      <Menu
        visible={ageMenuVisible}
        onDismiss={() => setAgeMenuVisible(false)}
        anchor={
          <Pressable onPress={() => setAgeMenuVisible(true)}>
            <TextInput
              mode="flat"
              value={age ? t(`form.ageOption.${age}`, { defaultValue: age }) : ''}
              editable={false}
              placeholder={t('form.agePlaceholder')}
              right={<TextInput.Icon icon="chevron-down" />}
              pointerEvents="none"
              style={softInputStyle}
              underlineColor={underlineColor}
              activeUnderlineColor={activeUnderlineColor}
            />
          </Pressable>
        }
      >
        <Menu.Item
          title={t('form.ageNotSpecified')}
          onPress={() => {
            setAge('');
            setAgeMenuVisible(false);
          }}
        />
        {AGE_OPTIONS.map((opt) => (
          <Menu.Item
            key={opt}
            title={t(`form.ageOption.${opt}`)}
            onPress={() => {
              setAge(opt);
              setAgeMenuVisible(false);
            }}
          />
        ))}
      </Menu>
    </>
  );
}

interface UsageFieldProps extends InputStyling {
  usage: string;
  setUsage: (v: string) => void;
  distanceUnit: string;
}

function UsageField({
  usage,
  setUsage,
  distanceUnit,
  softInputStyle,
  underlineColor,
  activeUnderlineColor,
}: UsageFieldProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');

  return (
    <>
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.usageLabel')}
      </Text>
      <View style={styles.usageRow}>
        <TextInput
          mode="flat"
          value={usage}
          onChangeText={setUsage}
          placeholder={t('form.usagePlaceholder')}
          keyboardType="numeric"
          style={[softInputStyle, styles.usageInput]}
          underlineColor={underlineColor}
          activeUnderlineColor={activeUnderlineColor}
        />
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {distanceUnit}
        </Text>
      </View>
    </>
  );
}

interface StorageFieldProps extends InputStyling {
  storageLocation: string;
  setStorageLocation: (v: string) => void;
  storageMenuVisible: boolean;
  setStorageMenuVisible: (v: boolean) => void;
  existingStorageLocations: string[];
}

function StorageField({
  storageLocation,
  setStorageLocation,
  storageMenuVisible,
  setStorageMenuVisible,
  existingStorageLocations,
  softInputStyle,
  underlineColor,
  activeUnderlineColor,
}: StorageFieldProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelBlurTimeout = useCallback(() => {
    if (blurTimeoutRef.current !== null) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => cancelBlurTimeout(), [cancelBlurTimeout]);

  return (
    <>
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.storageLabel')}
      </Text>
      <View style={styles.autocompleteWrapper}>
        <TextInput
          mode="flat"
          value={storageLocation}
          onChangeText={(text) => {
            setStorageLocation(text);
            setStorageMenuVisible(text.length > 0 && existingStorageLocations.length > 0);
          }}
          onFocus={() => {
            if (existingStorageLocations.length > 0) setStorageMenuVisible(true);
          }}
          onBlur={() => {
            cancelBlurTimeout();
            blurTimeoutRef.current = setTimeout(() => {
              blurTimeoutRef.current = null;
              setStorageMenuVisible(false);
            }, 200);
          }}
          placeholder={t('form.storagePlaceholder')}
          style={softInputStyle}
          underlineColor={underlineColor}
          activeUnderlineColor={activeUnderlineColor}
        />
        {storageMenuVisible && existingStorageLocations.length > 0 && (
          <View
            style={[
              styles.suggestionsContainer,
              { backgroundColor: theme.colors.surface, shadowColor: theme.colors.onSurface },
            ]}
          >
            <ScrollView
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {existingStorageLocations
                .filter(
                  (loc) =>
                    !storageLocation || loc.toLowerCase().includes(storageLocation.toLowerCase()),
                )
                .map((loc) => (
                  <Pressable
                    key={loc}
                    onPressIn={cancelBlurTimeout}
                    onPress={() => {
                      setStorageLocation(loc);
                      setStorageMenuVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.suggestionItem,
                      pressed && { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                  >
                    <Text variant="bodyMedium">{loc}</Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        )}
      </View>
    </>
  );
}

interface DescriptionFieldProps extends InputStyling {
  description: string;
  setDescription: (v: string) => void;
}

function DescriptionField({
  description,
  setDescription,
  softInputStyle,
  underlineColor,
  activeUnderlineColor,
}: DescriptionFieldProps) {
  const { t } = useTranslation('inventory');

  return (
    <>
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.descriptionLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={description}
        onChangeText={setDescription}
        placeholder={t('form.descriptionPlaceholder')}
        multiline
        numberOfLines={3}
        style={softInputStyle}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />
    </>
  );
}

interface TagsFieldProps extends InputStyling {
  tags: string[];
  tagInput: string;
  setTagInput: (v: string) => void;
  tagSuggestionsVisible: boolean;
  setTagSuggestionsVisible: (v: boolean) => void;
  filteredTagSuggestions: string[];
  handleAddTag: (raw: string) => void;
  handleRemoveTag: (tag: string) => void;
  clearTagBlurCommitTimeout: () => void;
  tagBlurCommitTimeoutRef: ItemFormState['tagBlurCommitTimeoutRef'];
}

function TagsField({
  tags,
  tagInput,
  setTagInput,
  tagSuggestionsVisible,
  setTagSuggestionsVisible,
  filteredTagSuggestions,
  handleAddTag,
  handleRemoveTag,
  clearTagBlurCommitTimeout,
  tagBlurCommitTimeoutRef,
  softInputStyle,
  underlineColor,
  activeUnderlineColor,
}: TagsFieldProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');

  return (
    <>
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.tagsLabel')}
      </Text>
      {tags.length > 0 && (
        <View style={styles.chipRow}>
          {tags.map((tag) => (
            <Chip key={tag} onClose={() => handleRemoveTag(tag)} style={styles.tagChip} compact>
              {tag}
            </Chip>
          ))}
        </View>
      )}
      <View style={styles.autocompleteWrapper}>
        <TextInput
          mode="flat"
          value={tagInput}
          onChangeText={(text) => {
            if (text.endsWith(',')) {
              handleAddTag(text.slice(0, -1));
              return;
            }
            setTagInput(text);
            setTagSuggestionsVisible(text.trim().length > 0 && filteredTagSuggestions.length > 0);
          }}
          onFocus={() => {
            if (tagInput.trim() && filteredTagSuggestions.length > 0) {
              setTagSuggestionsVisible(true);
            }
          }}
          onBlur={() => {
            clearTagBlurCommitTimeout();
            const rawAtBlur = tagInput;
            tagBlurCommitTimeoutRef.current = setTimeout(() => {
              tagBlurCommitTimeoutRef.current = null;
              handleAddTag(rawAtBlur);
            }, 200);
          }}
          onSubmitEditing={() => handleAddTag(tagInput)}
          placeholder={t('form.tagsPlaceholder')}
          style={softInputStyle}
          underlineColor={underlineColor}
          activeUnderlineColor={activeUnderlineColor}
          returnKeyType="done"
        />
        {tagSuggestionsVisible && filteredTagSuggestions.length > 0 && (
          <View
            style={[
              styles.suggestionsContainer,
              { backgroundColor: theme.colors.surface, shadowColor: theme.colors.onSurface },
            ]}
          >
            <ScrollView
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {filteredTagSuggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPressIn={clearTagBlurCommitTimeout}
                  onPress={() => handleAddTag(suggestion)}
                  style={({ pressed }) => [
                    styles.suggestionItem,
                    pressed && { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Text variant="bodyMedium">{suggestion}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </>
  );
}
