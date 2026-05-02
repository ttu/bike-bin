import { useRef, useCallback, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text, TextInput, Chip, Button, Menu, HelperText, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';
import { ItemCategory } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { AGE_OPTIONS } from '../../../constants';
import type { InputStyling, ItemFormState } from '../types';
import type { ItemFormErrors } from '../../../utils/validation';
import { styles } from '../styles';

interface OptionalSectionProps {
  readonly state: ItemFormState;
  readonly inputStyling: InputStyling;
}

export function OptionalSection({ state, inputStyling }: Readonly<OptionalSectionProps>) {
  const { t } = useTranslation('inventory');
  const {
    showOptional,
    setShowOptional,
    category,
    purchaseDate,
    setPurchaseDate,
    mountedDate,
    setMountedDate,
    errors,
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
  } = state;

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
          <OptionalDateFields
            purchaseDate={purchaseDate}
            setPurchaseDate={setPurchaseDate}
            mountedDate={mountedDate}
            setMountedDate={setMountedDate}
            purchaseDateError={errors.purchaseDate}
            mountedDateError={errors.mountedDate}
            inputStyling={inputStyling}
          />
          <AgeField
            age={age}
            setAge={setAge}
            ageMenuVisible={ageMenuVisible}
            setAgeMenuVisible={setAgeMenuVisible}
            inputStyling={inputStyling}
          />
          {(category === ItemCategory.Component || category === ItemCategory.Accessory) && (
            <UsageField
              usage={usage}
              setUsage={setUsage}
              distanceUnit={distanceUnit}
              inputStyling={inputStyling}
            />
          )}
          <StorageField
            storageLocation={storageLocation}
            setStorageLocation={setStorageLocation}
            storageMenuVisible={storageMenuVisible}
            setStorageMenuVisible={setStorageMenuVisible}
            existingStorageLocations={existingStorageLocations}
            inputStyling={inputStyling}
          />
          <DescriptionField
            description={description}
            setDescription={setDescription}
            inputStyling={inputStyling}
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
            inputStyling={inputStyling}
          />
        </View>
      )}
    </>
  );
}

// ── Sub-fields (private to this module) ────────────────────────

interface OptionalDateFieldsProps {
  readonly purchaseDate: string;
  readonly setPurchaseDate: (v: string) => void;
  readonly mountedDate: string;
  readonly setMountedDate: (v: string) => void;
  readonly purchaseDateError: ItemFormErrors['purchaseDate'];
  readonly mountedDateError: ItemFormErrors['mountedDate'];
  readonly inputStyling: InputStyling;
}

function OptionalDateFields({
  purchaseDate,
  setPurchaseDate,
  mountedDate,
  setMountedDate,
  purchaseDateError,
  mountedDateError,
  inputStyling,
}: Readonly<OptionalDateFieldsProps>) {
  const { t } = useTranslation('inventory');

  return (
    <>
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.boughtDateLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={purchaseDate}
        onChangeText={setPurchaseDate}
        placeholder={t('form.datePlaceholder')}
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
        autoCorrect={false}
        error={!!purchaseDateError}
        style={inputStyling.softInputStyle}
        underlineColor={inputStyling.underlineColor}
        activeUnderlineColor={inputStyling.activeUnderlineColor}
      />
      {purchaseDateError ? (
        <HelperText type="error" visible>
          {purchaseDateError}
        </HelperText>
      ) : null}

      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.mountedDateLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={mountedDate}
        onChangeText={setMountedDate}
        placeholder={t('form.datePlaceholder')}
        keyboardType="numbers-and-punctuation"
        autoCapitalize="none"
        autoCorrect={false}
        error={!!mountedDateError}
        style={inputStyling.softInputStyle}
        underlineColor={inputStyling.underlineColor}
        activeUnderlineColor={inputStyling.activeUnderlineColor}
      />
      {mountedDateError ? (
        <HelperText type="error" visible>
          {mountedDateError}
        </HelperText>
      ) : null}
    </>
  );
}

interface AgeFieldProps {
  readonly age: string;
  readonly setAge: (v: string) => void;
  readonly ageMenuVisible: boolean;
  readonly setAgeMenuVisible: (v: boolean) => void;
  readonly inputStyling: InputStyling;
}

function AgeField({
  age,
  setAge,
  ageMenuVisible,
  setAgeMenuVisible,
  inputStyling,
}: Readonly<AgeFieldProps>) {
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
              style={[inputStyling.softInputStyle, { pointerEvents: 'none' }]}
              underlineColor={inputStyling.underlineColor}
              activeUnderlineColor={inputStyling.activeUnderlineColor}
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

interface UsageFieldProps {
  readonly usage: string;
  readonly setUsage: (v: string) => void;
  readonly distanceUnit: string;
  readonly inputStyling: InputStyling;
}

function UsageField({ usage, setUsage, distanceUnit, inputStyling }: Readonly<UsageFieldProps>) {
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
          keyboardType="decimal-pad"
          style={[inputStyling.softInputStyle, styles.usageInput]}
          underlineColor={inputStyling.underlineColor}
          activeUnderlineColor={inputStyling.activeUnderlineColor}
        />
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {distanceUnit}
        </Text>
      </View>
    </>
  );
}

interface StorageFieldProps {
  readonly storageLocation: string;
  readonly setStorageLocation: (v: string) => void;
  readonly storageMenuVisible: boolean;
  readonly setStorageMenuVisible: (v: boolean) => void;
  readonly existingStorageLocations: string[];
  readonly inputStyling: InputStyling;
}

function StorageField({
  storageLocation,
  setStorageLocation,
  storageMenuVisible,
  setStorageMenuVisible,
  existingStorageLocations,
  inputStyling,
}: Readonly<StorageFieldProps>) {
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
          style={inputStyling.softInputStyle}
          underlineColor={inputStyling.underlineColor}
          activeUnderlineColor={inputStyling.activeUnderlineColor}
        />
        {storageMenuVisible && existingStorageLocations.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface }]}>
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

interface DescriptionFieldProps {
  readonly description: string;
  readonly setDescription: (v: string) => void;
  readonly inputStyling: InputStyling;
}

function DescriptionField({
  description,
  setDescription,
  inputStyling,
}: Readonly<DescriptionFieldProps>) {
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
        style={inputStyling.softInputStyle}
        underlineColor={inputStyling.underlineColor}
        activeUnderlineColor={inputStyling.activeUnderlineColor}
      />
    </>
  );
}

interface TagsFieldProps {
  readonly tags: string[];
  readonly tagInput: string;
  readonly setTagInput: (v: string) => void;
  readonly tagSuggestionsVisible: boolean;
  readonly setTagSuggestionsVisible: (v: boolean) => void;
  readonly filteredTagSuggestions: string[];
  readonly handleAddTag: (raw: string) => void;
  readonly handleRemoveTag: (tag: string) => void;
  readonly clearTagBlurCommitTimeout: () => void;
  readonly tagBlurCommitTimeoutRef: ItemFormState['tagBlurCommitTimeoutRef'];
  readonly inputStyling: InputStyling;
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
  inputStyling,
}: Readonly<TagsFieldProps>) {
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
          style={inputStyling.softInputStyle}
          underlineColor={inputStyling.underlineColor}
          activeUnderlineColor={inputStyling.activeUnderlineColor}
          returnKeyType="done"
        />
        {tagSuggestionsVisible && filteredTagSuggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface }]}>
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
