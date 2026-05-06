import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { lightTheme } from '@/shared/theme';
import {
  AvailabilityType,
  GroupRole,
  ItemCategory,
  ItemCondition,
  Visibility,
  type DistanceUnit,
  type GroupId,
} from '@/shared/types';
import type { GroupWithRole } from '@/features/groups';
import { VisibilitySection } from './VisibilitySection';
import type { ItemFormState } from '../types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockUseGroups = jest.fn();
jest.mock('@/features/groups', () => ({
  useGroups: () => mockUseGroups(),
}));

interface Overrides {
  visibility?: Visibility;
  groupIds?: GroupId[];
  errors?: ItemFormState['errors'];
}

interface Handlers {
  setVisibility: jest.Mock;
  toggleGroupId: jest.Mock;
}

function buildState(overrides: Overrides, handlers: Handlers): ItemFormState {
  return {
    name: '',
    nameFieldValue: '',
    setName: jest.fn(),
    quantityStr: '1',
    setQuantityStr: jest.fn(),
    category: ItemCategory.Component,
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
    visibility: overrides.visibility ?? Visibility.Private,
    setVisibility: handlers.setVisibility,
    groupIds: overrides.groupIds ?? [],
    toggleGroupId: handlers.toggleGroupId,
    handleCategoryChange: jest.fn(),
    currentSubcategories: [],
    remainingPercentStr: '',
    setRemainingPercentStr: jest.fn(),
    purchaseDate: '',
    setPurchaseDate: jest.fn(),
    mountedDate: '',
    setMountedDate: jest.fn(),
    age: '',
    setAge: jest.fn(),
    ageMenuVisible: false,
    setAgeMenuVisible: jest.fn(),
    usage: '',
    setUsage: jest.fn(),
    distanceUnit: 'km' as DistanceUnit,
    storageLocation: '',
    setStorageLocation: jest.fn(),
    storageMenuVisible: false,
    setStorageMenuVisible: jest.fn(),
    existingStorageLocations: [],
    description: '',
    setDescription: jest.fn(),
    tags: [],
    tagInput: '',
    setTagInput: jest.fn(),
    tagSuggestionsVisible: false,
    setTagSuggestionsVisible: jest.fn(),
    filteredTagSuggestions: [],
    handleAddTag: jest.fn(),
    handleRemoveTag: jest.fn(),
    clearTagBlurCommitTimeout: jest.fn(),
    scheduleTagBlurCommit: jest.fn(),
    showOptional: false,
    setShowOptional: jest.fn(),
    errors: overrides.errors ?? {},
    handleSubmit: jest.fn(),
    isDirty: false,
  };
}

function renderSection(overrides: Overrides = {}) {
  const handlers: Handlers = {
    setVisibility: jest.fn(),
    toggleGroupId: jest.fn(),
  };
  const utils = render(
    <PaperProvider theme={lightTheme}>
      <VisibilitySection state={buildState(overrides, handlers)} />
    </PaperProvider>,
  );
  return { ...utils, handlers };
}

const mockGroup = (id: string, name: string): GroupWithRole => ({
  id: id as GroupId,
  name,
  description: undefined,
  isPublic: false,
  ratingAvg: 0,
  ratingCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  memberRole: GroupRole.Member,
  joinedAt: '2026-01-01T00:00:00Z',
});

describe('VisibilitySection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGroups.mockReturnValue({ data: [] });
  });

  it('renders all three visibility chips', () => {
    renderSection();
    expect(screen.getByText('form.visibilityPrivate')).toBeTruthy();
    expect(screen.getByText('form.visibilityAll')).toBeTruthy();
    expect(screen.getByText('form.visibilityGroups')).toBeTruthy();
  });

  it('calls setVisibility when a visibility chip is pressed', () => {
    const { handlers } = renderSection();
    fireEvent.press(screen.getByText('form.visibilityAll'));
    expect(handlers.setVisibility).toHaveBeenCalledWith(Visibility.All);
  });

  it('does not render group selection when visibility is not Groups', () => {
    renderSection({ visibility: Visibility.All });
    expect(screen.queryByText('form.noGroups')).toBeNull();
  });

  it('shows the empty state when Groups is selected and user has no groups', () => {
    mockUseGroups.mockReturnValue({ data: [] });
    renderSection({ visibility: Visibility.Groups });
    expect(screen.getByText('form.noGroups')).toBeTruthy();
  });

  it('renders user groups as chips and toggles selection on press', () => {
    mockUseGroups.mockReturnValue({
      data: [mockGroup('group-1', 'Riders'), mockGroup('group-2', 'Repairs')],
    });
    const { handlers } = renderSection({
      visibility: Visibility.Groups,
      groupIds: ['group-1' as GroupId],
    });

    expect(screen.getByText('Riders')).toBeTruthy();
    expect(screen.getByText('Repairs')).toBeTruthy();

    fireEvent.press(screen.getByText('Repairs'));
    expect(handlers.toggleGroupId).toHaveBeenCalledWith('group-2');
  });

  it('shows the groupIds error helper when present', () => {
    mockUseGroups.mockReturnValue({ data: [] });
    renderSection({
      visibility: Visibility.Groups,
      errors: { groupIds: 'Pick at least one group' },
    });
    expect(screen.getByText('Pick at least one group')).toBeTruthy();
  });
});
