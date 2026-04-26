import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { lightTheme } from '@/shared/theme';
import { ItemCategory } from '@/shared/types';
import { OptionalSection } from './OptionalSection';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

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

function renderSection(overrides: OverrideProps = {}) {
  const setShowOptional = jest.fn();
  const setAge = jest.fn();
  const setAgeMenuVisible = jest.fn();
  const setStorageLocation = jest.fn();
  const setStorageMenuVisible = jest.fn();
  const setTagInput = jest.fn();
  const setTagSuggestionsVisible = jest.fn();
  const handleAddTag = jest.fn();
  const handleRemoveTag = jest.fn();
  const clearTagBlurCommitTimeout = jest.fn();

  const utils = render(
    <PaperProvider theme={lightTheme}>
      <OptionalSection
        showOptional={overrides.showOptional ?? true}
        setShowOptional={setShowOptional}
        category={overrides.category ?? ItemCategory.Component}
        purchaseDate=""
        setPurchaseDate={jest.fn()}
        mountedDate=""
        setMountedDate={jest.fn()}
        errors={{}}
        age=""
        setAge={setAge}
        ageMenuVisible={overrides.ageMenuVisible ?? false}
        setAgeMenuVisible={setAgeMenuVisible}
        usage=""
        setUsage={jest.fn()}
        distanceUnit="km"
        storageLocation={overrides.storageLocation ?? ''}
        setStorageLocation={setStorageLocation}
        storageMenuVisible={overrides.storageMenuVisible ?? false}
        setStorageMenuVisible={setStorageMenuVisible}
        existingStorageLocations={overrides.existingStorageLocations ?? []}
        description=""
        setDescription={jest.fn()}
        tags={overrides.tags ?? []}
        tagInput={overrides.tagInput ?? ''}
        setTagInput={setTagInput}
        tagSuggestionsVisible={overrides.tagSuggestionsVisible ?? false}
        setTagSuggestionsVisible={setTagSuggestionsVisible}
        filteredTagSuggestions={overrides.filteredTagSuggestions ?? []}
        handleAddTag={handleAddTag}
        handleRemoveTag={handleRemoveTag}
        clearTagBlurCommitTimeout={clearTagBlurCommitTimeout}
        tagBlurCommitTimeoutRef={{ current: null }}
        softInputStyle={{ backgroundColor: '#fff', borderRadius: 8 }}
        underlineColor="#ccc"
        activeUnderlineColor="#000"
      />
    </PaperProvider>,
  );

  return {
    ...utils,
    handlers: {
      setShowOptional,
      setAge,
      setAgeMenuVisible,
      setStorageLocation,
      setStorageMenuVisible,
      setTagInput,
      setTagSuggestionsVisible,
      handleAddTag,
      handleRemoveTag,
      clearTagBlurCommitTimeout,
    },
  };
}

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
