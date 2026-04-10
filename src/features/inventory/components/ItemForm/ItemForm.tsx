import { ScrollView } from 'react-native';
import { Banner, Text, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';
import { ItemCategory } from '@/shared/types';

import { useItemFormState } from './useItemFormState';
import type { ItemFormProps, InputStyling } from './types';
import { styles } from './styles';
import {
  NameSection,
  QuantitySection,
  CategorySection,
  ConditionSection,
  RemainingFractionSection,
  BrandModelSection,
  AvailabilitySection,
  VisibilitySection,
  OptionalSection,
  ActionsSection,
} from './sections';

export function ItemForm({
  initialData,
  initialCategory,
  onSave,
  onDelete,
  isSubmitting,
  isEditMode = false,
  headerComponent,
  photoSection,
  submitBlockedMessage,
}: ItemFormProps) {
  const theme = useTheme<AppTheme>();
  const state = useItemFormState({ initialData, initialCategory, onSave });

  const hasSubmitBlock = Boolean(submitBlockedMessage && submitBlockedMessage.length > 0);

  const inputStyling: InputStyling = {
    softInputStyle: {
      backgroundColor: theme.customColors.surfaceContainerHighest,
      borderRadius: 12,
    },
    underlineColor: theme.colors.outlineVariant + '26',
    activeUnderlineColor: theme.colors.primary,
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {headerComponent}
      {photoSection}

      <BrandModelSection
        name={state.name}
        brand={state.brand}
        brandMenuVisible={state.brandMenuVisible}
        handleBrandFocus={state.handleBrandFocus}
        handleBrandBlur={state.handleBrandBlur}
        cancelBrandBlurTimeout={state.cancelBrandBlurTimeout}
        filteredBrands={state.filteredBrands}
        model={state.model}
        setModel={state.setModel}
        handleBrandSelect={state.handleBrandSelect}
        handleBrandInputChange={state.handleBrandInputChange}
        {...inputStyling}
      />

      <NameSection
        nameFieldValue={state.nameFieldValue}
        setName={state.setName}
        errors={state.errors}
        {...inputStyling}
      />

      <QuantitySection
        quantityStr={state.quantityStr}
        setQuantityStr={state.setQuantityStr}
        errors={state.errors}
        {...inputStyling}
      />

      <CategorySection
        category={state.category}
        handleCategoryChange={state.handleCategoryChange}
        subcategory={state.subcategory}
        setSubcategory={state.setSubcategory}
        currentSubcategories={state.currentSubcategories}
        errors={state.errors}
      />

      {state.category && state.category !== ItemCategory.Consumable && (
        <ConditionSection
          condition={state.condition}
          setCondition={state.setCondition}
          errors={state.errors}
        />
      )}

      {state.category === ItemCategory.Consumable && (
        <RemainingFractionSection
          remainingPercentStr={state.remainingPercentStr}
          setRemainingPercentStr={state.setRemainingPercentStr}
          errors={state.errors}
          {...inputStyling}
        />
      )}

      <AvailabilitySection
        availabilityTypes={state.availabilityTypes}
        toggleAvailability={state.toggleAvailability}
        isSellable={state.isSellable}
        isBorrowable={state.isBorrowable}
        price={state.price}
        setPrice={state.setPrice}
        deposit={state.deposit}
        setDeposit={state.setDeposit}
        borrowDuration={state.borrowDuration}
        setBorrowDuration={state.setBorrowDuration}
        durationMenuVisible={state.durationMenuVisible}
        setDurationMenuVisible={state.setDurationMenuVisible}
        errors={state.errors}
        {...inputStyling}
      />

      <VisibilitySection
        visibility={state.visibility}
        setVisibility={state.setVisibility}
        groupIds={state.groupIds}
        toggleGroupId={state.toggleGroupId}
        errors={state.errors}
      />

      <OptionalSection
        showOptional={state.showOptional}
        setShowOptional={state.setShowOptional}
        category={state.category}
        purchaseDate={state.purchaseDate}
        setPurchaseDate={state.setPurchaseDate}
        mountedDate={state.mountedDate}
        setMountedDate={state.setMountedDate}
        errors={state.errors}
        age={state.age}
        setAge={state.setAge}
        ageMenuVisible={state.ageMenuVisible}
        setAgeMenuVisible={state.setAgeMenuVisible}
        usage={state.usage}
        setUsage={state.setUsage}
        distanceUnit={state.distanceUnit}
        storageLocation={state.storageLocation}
        setStorageLocation={state.setStorageLocation}
        storageMenuVisible={state.storageMenuVisible}
        setStorageMenuVisible={state.setStorageMenuVisible}
        existingStorageLocations={state.existingStorageLocations}
        description={state.description}
        setDescription={state.setDescription}
        tags={state.tags}
        tagInput={state.tagInput}
        setTagInput={state.setTagInput}
        tagSuggestionsVisible={state.tagSuggestionsVisible}
        setTagSuggestionsVisible={state.setTagSuggestionsVisible}
        filteredTagSuggestions={state.filteredTagSuggestions}
        handleAddTag={state.handleAddTag}
        handleRemoveTag={state.handleRemoveTag}
        clearTagBlurCommitTimeout={state.clearTagBlurCommitTimeout}
        tagBlurCommitTimeoutRef={state.tagBlurCommitTimeoutRef}
        {...inputStyling}
      />

      {hasSubmitBlock ? (
        <Banner visible icon="information" style={styles.limitBanner}>
          <Text variant="bodyMedium">{submitBlockedMessage}</Text>
        </Banner>
      ) : null}

      <ActionsSection
        handleSubmit={state.handleSubmit}
        isSubmitting={isSubmitting}
        isEditMode={isEditMode}
        onDelete={onDelete}
        saveDisabled={hasSubmitBlock}
      />
    </ScrollView>
  );
}
