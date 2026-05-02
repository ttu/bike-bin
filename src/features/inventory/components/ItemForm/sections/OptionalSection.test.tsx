import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { lightTheme } from '@/shared/theme';
import {
  AvailabilityType,
  ItemCategory,
  ItemCondition,
  Visibility,
  type DistanceUnit,
} from '@/shared/types';
import { OptionalSection } from './OptionalSection';
import type { InputStyling, ItemFormState } from '../types';

interface OverrideProps {
  showOptional?: boolean;
  category?: ItemCategory;
  ageMenuVisible?: boolean;
  storageMenuVisible?: boolean;
  tagSuggestionsVisible?: boolean;
  storageLocation?: string;
  existingStorageLocations?: string[];
  tags?: string[];
  tagInput?: string;
  filteredTagSuggestions?: string[];
}

interface Handlers {
  setShowOptional: jest.Mock;
  setAge: jest.Mock;
  setAgeMenuVisible: jest.Mock;
  setStorageLocation: jest.Mock;
  setStorageMenuVisible: jest.Mock;
  setTagInput: jest.Mock;
  setTagSuggestionsVisible: jest.Mock;
  handleAddTag: jest.Mock;
  handleRemoveTag: jest.Mock;
  clearTagBlurCommitTimeout: jest.Mock;
}

function buildState(overrides: OverrideProps, handlers: Handlers): ItemFormState {
  return {
    name: '',
    nameFieldValue: '',
    setName: jest.fn(),
    quantityStr: '1',
    setQuantityStr: jest.fn(),
    category: overrides.category ?? ItemCategory.Component,
    subcategory: '',
    setSubcategory: jest.fn(),
    condition: ItemCondition.New,
    setCondition: jest.fn(),
    brand: '',
    brandMenuVisible: false,
    handleBrandFocus: jest.fn(),
    handleBrandBlur: jest.fn(),
    cancelBrandBlurTimeout: jest.fn(),
    filteredBrands: [],
    model: '',
    setModel: jest.fn(),
    handleBrandSelect: jest.fn(),
    handleBrandInputChange: jest.fn(),
    availabilityTypes: [AvailabilityType.Private],
    toggleAvailability: jest.fn(),
    isSellable: false,
    isBorrowable: false,
    price: '',
    setPrice: jest.fn(),
    deposit: '',
    setDeposit: jest.fn(),
    borrowDuration: '',
    setBorrowDuration: jest.fn(),
    durationMenuVisible: false,
    setDurationMenuVisible: jest.fn(),
    visibility: Visibility.Private,
    setVisibility: jest.fn(),
    groupIds: [],
    toggleGroupId: jest.fn(),
    handleCategoryChange: jest.fn(),
    currentSubcategories: [],
    remainingPercentStr: '',
    setRemainingPercentStr: jest.fn(),
    purchaseDate: '',
    setPurchaseDate: jest.fn(),
    mountedDate: '',
    setMountedDate: jest.fn(),
    age: '',
    setAge: handlers.setAge,
    ageMenuVisible: overrides.ageMenuVisible ?? false,
    setAgeMenuVisible: handlers.setAgeMenuVisible,
    usage: '',
    setUsage: jest.fn(),
    distanceUnit: 'km' as DistanceUnit,
    storageLocation: overrides.storageLocation ?? '',
    setStorageLocation: handlers.setStorageLocation,
    storageMenuVisible: overrides.storageMenuVisible ?? false,
    setStorageMenuVisible: handlers.setStorageMenuVisible,
    existingStorageLocations: overrides.existingStorageLocations ?? [],
    description: '',
    setDescription: jest.fn(),
    tags: overrides.tags ?? [],
    tagInput: overrides.tagInput ?? '',
    setTagInput: handlers.setTagInput,
    tagSuggestionsVisible: overrides.tagSuggestionsVisible ?? false,
    setTagSuggestionsVisible: handlers.setTagSuggestionsVisible,
    filteredTagSuggestions: overrides.filteredTagSuggestions ?? [],
    handleAddTag: handlers.handleAddTag,
    handleRemoveTag: handlers.handleRemoveTag,
    clearTagBlurCommitTimeout: handlers.clearTagBlurCommitTimeout,
    tagBlurCommitTimeoutRef: { current: null },
    showOptional: overrides.showOptional ?? true,
    setShowOptional: handlers.setShowOptional,
    errors: {},
    handleSubmit: jest.fn(),
    isDirty: false,
  };
}

function renderSection(overrides: OverrideProps = {}) {
  const handlers: Handlers = {
    setShowOptional: jest.fn(),
    setAge: jest.fn(),
    setAgeMenuVisible: jest.fn(),
    setStorageLocation: jest.fn(),
    setStorageMenuVisible: jest.fn(),
    setTagInput: jest.fn(),
    setTagSuggestionsVisible: jest.fn(),
    handleAddTag: jest.fn(),
    handleRemoveTag: jest.fn(),
    clearTagBlurCommitTimeout: jest.fn(),
  };

  const state = buildState(overrides, handlers);
  const inputStyling: InputStyling = {
    softInputStyle: { backgroundColor: '#fff', borderRadius: 8 },
    underlineColor: '#ccc',
    activeUnderlineColor: '#000',
  };

  const utils = render(
    <PaperProvider theme={lightTheme}>
      <OptionalSection state={state} inputStyling={inputStyling} />
    </PaperProvider>,
  );

  return { ...utils, handlers };
}

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('OptionalSection', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders all optional fields when expanded', () => {
    renderSection({
      storageLocation: '',
      existingStorageLocations: ['Workshop Shelf'],
      storageMenuVisible: true,
      tagInput: 'gr',
      filteredTagSuggestions: ['Greased'],
      tagSuggestionsVisible: true,
      tags: ['old'],
    });

    expect(screen.getByText('Workshop Shelf')).toBeTruthy();
    expect(screen.getByText('Greased')).toBeTruthy();
    expect(screen.getByText('old')).toBeTruthy();
    expect(screen.getByText('form.boughtDateLabel')).toBeTruthy();
    expect(screen.getByText('form.ageLabel')).toBeTruthy();
    expect(screen.getByText('form.usageLabel')).toBeTruthy();
    expect(screen.getByText('form.descriptionLabel')).toBeTruthy();
    expect(screen.getByText('form.tagsLabel')).toBeTruthy();
  });

  it('toggles showOptional when the section button is pressed', () => {
    const { handlers } = renderSection({ showOptional: false });
    fireEvent.press(screen.getByText('form.optionalSection'));
    expect(handlers.setShowOptional).toHaveBeenCalledWith(true);
  });

  it('hides UsageField for non-component, non-accessory categories', () => {
    renderSection({ category: ItemCategory.Bike });
    expect(screen.queryByText('form.usageLabel')).toBeNull();
  });

  it('renders age menu items and applies selection', () => {
    const { handlers } = renderSection({ ageMenuVisible: true });
    const notSpecified = screen.getByText('form.ageNotSpecified');
    fireEvent.press(notSpecified);
    expect(handlers.setAge).toHaveBeenCalledWith('');
    expect(handlers.setAgeMenuVisible).toHaveBeenCalledWith(false);
  });

  it('shows storage suggestions filtered by input and selects one', () => {
    const { handlers } = renderSection({
      storageLocation: 'work',
      existingStorageLocations: ['Workshop Shelf', 'Garage'],
      storageMenuVisible: true,
    });
    const suggestion = screen.getByText('Workshop Shelf');
    expect(screen.queryByText('Garage')).toBeNull();
    fireEvent.press(suggestion);
    expect(handlers.setStorageLocation).toHaveBeenCalledWith('Workshop Shelf');
    expect(handlers.setStorageMenuVisible).toHaveBeenCalledWith(false);
  });

  it('opens storage suggestions on focus when locations exist', () => {
    const { handlers } = renderSection({
      existingStorageLocations: ['Garage'],
    });
    const input = screen.getByPlaceholderText('form.storagePlaceholder');
    fireEvent(input, 'focus');
    expect(handlers.setStorageMenuVisible).toHaveBeenCalledWith(true);
  });

  it('shows storage suggestions when typing into the input', () => {
    const { handlers } = renderSection({
      existingStorageLocations: ['Garage'],
    });
    const input = screen.getByPlaceholderText('form.storagePlaceholder');
    fireEvent.changeText(input, 'g');
    expect(handlers.setStorageLocation).toHaveBeenCalledWith('g');
    expect(handlers.setStorageMenuVisible).toHaveBeenCalledWith(true);
  });

  it('hides storage suggestions on blur after a delay', () => {
    const { handlers } = renderSection({
      existingStorageLocations: ['Garage'],
      storageMenuVisible: true,
    });
    const input = screen.getByPlaceholderText('form.storagePlaceholder');
    fireEvent(input, 'blur');
    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(handlers.setStorageMenuVisible).toHaveBeenCalledWith(false);
  });

  it('removes a tag when its chip close button is pressed', () => {
    const { handlers } = renderSection({ tags: ['rusty'] });
    expect(screen.getByText('rusty')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Close'));
    expect(handlers.handleRemoveTag).toHaveBeenCalledWith('rusty');
  });

  it('commits a tag when the input ends with a comma', () => {
    const { handlers } = renderSection();
    const input = screen.getByPlaceholderText('form.tagsPlaceholder');
    fireEvent.changeText(input, 'fast,');
    expect(handlers.handleAddTag).toHaveBeenCalledWith('fast');
  });

  it('updates tag input and toggles suggestions while typing', () => {
    const { handlers } = renderSection({ filteredTagSuggestions: ['Slick'] });
    const input = screen.getByPlaceholderText('form.tagsPlaceholder');
    fireEvent.changeText(input, 'sl');
    expect(handlers.setTagInput).toHaveBeenCalledWith('sl');
    expect(handlers.setTagSuggestionsVisible).toHaveBeenCalledWith(true);
  });

  it('selects a tag suggestion via press', () => {
    const { handlers } = renderSection({
      tagInput: 'sl',
      filteredTagSuggestions: ['Slick'],
      tagSuggestionsVisible: true,
    });
    fireEvent.press(screen.getByText('Slick'));
    expect(handlers.handleAddTag).toHaveBeenCalledWith('Slick');
  });

  it('commits tag input via submit editing', () => {
    const { handlers } = renderSection({ tagInput: 'fast' });
    const input = screen.getByPlaceholderText('form.tagsPlaceholder');
    fireEvent(input, 'submitEditing');
    expect(handlers.handleAddTag).toHaveBeenCalledWith('fast');
  });
});
