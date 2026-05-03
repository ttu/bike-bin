import { act, renderHook } from '@testing-library/react-native';
import { createQueryClientHookWrapper } from '@/test/queryTestUtils';
import {
  AvailabilityType,
  ItemCategory,
  ItemCondition,
  Visibility,
  type GroupId,
} from '@/shared/types';
import { useItemFormState } from '../useItemFormState';

jest.mock('../../../hooks/useItems', () => ({
  useItems: () => ({ data: [{ storageLocation: 'Garage' }, { storageLocation: 'Shed' }] }),
}));

jest.mock('../../../hooks/useUserTags', () => ({
  useUserTags: () => ({ data: ['carbon', 'aero', 'steel'] }),
}));

jest.mock('@/features/profile', () => ({
  useDistanceUnit: () => ({ distanceUnit: 'km' }),
}));

const wrapper = createQueryClientHookWrapper();

describe('useItemFormState — setter coverage', () => {
  it('exposes setters that dispatch into the reducer', () => {
    const onSave = jest.fn();
    const { result } = renderHook(() => useItemFormState({ onSave }), { wrapper });

    act(() => result.current.setName('Hub'));
    act(() => result.current.setQuantityStr('4'));
    act(() => result.current.handleCategoryChange(ItemCategory.Component));
    act(() => result.current.setSubcategory('Brakes'));
    act(() => result.current.setCondition(ItemCondition.Worn));
    act(() => result.current.setModel('XTR'));
    act(() => result.current.toggleAvailability(AvailabilityType.Sellable));
    act(() => result.current.setPrice('99'));
    act(() => result.current.setDeposit('20'));
    act(() => result.current.toggleAvailability(AvailabilityType.Borrowable));
    act(() => result.current.setBorrowDuration('one_week'));
    act(() => result.current.setDurationMenuVisible(true));
    act(() => result.current.setVisibility(Visibility.All));
    act(() => result.current.setShowOptional(true));
    act(() => result.current.setPurchaseDate('2025-01-01'));
    act(() => result.current.setMountedDate('2025-02-02'));
    act(() => result.current.setAge('less_than_6_months'));
    act(() => result.current.setAgeMenuVisible(true));
    act(() => result.current.setUsage('500'));
    act(() => result.current.setStorageLocation('Garage'));
    act(() => result.current.setStorageMenuVisible(true));
    act(() => result.current.setDescription('worn but works'));
    act(() => result.current.handleAddTag('carbon'));
    act(() => result.current.handleRemoveTag('carbon'));
    act(() => result.current.setTagInput('aero'));
    act(() => result.current.setTagSuggestionsVisible(true));

    const s = result.current;
    expect(s.name).toBe('Hub');
    expect(s.quantityStr).toBe('4');
    expect(s.category).toBe(ItemCategory.Component);
    expect(s.subcategory).toBe('Brakes');
    expect(s.condition).toBe(ItemCondition.Worn);
    expect(s.model).toBe('XTR');
    expect(s.availabilityTypes).toEqual([AvailabilityType.Sellable, AvailabilityType.Borrowable]);
    expect(s.isSellable).toBe(true);
    expect(s.isBorrowable).toBe(true);
    expect(s.price).toBe('99');
    expect(s.deposit).toBe('20');
    expect(s.borrowDuration).toBe('one_week');
    expect(s.durationMenuVisible).toBe(true);
    expect(s.visibility).toBe(Visibility.All);
    expect(s.showOptional).toBe(true);
    expect(s.purchaseDate).toBe('2025-01-01');
    expect(s.mountedDate).toBe('2025-02-02');
    expect(s.age).toBe('less_than_6_months');
    expect(s.ageMenuVisible).toBe(true);
    expect(s.usage).toBe('500');
    expect(s.storageLocation).toBe('Garage');
    expect(s.storageMenuVisible).toBe(true);
    expect(s.description).toBe('worn but works');
    expect(s.tagInput).toBe('aero');
    expect(s.tagSuggestionsVisible).toBe(true);
    expect(s.tags).toEqual([]);
    expect(s.existingStorageLocations).toEqual(['Garage', 'Shed']);
  });

  it('derives nameFieldValue from brand + model when name is blank', () => {
    const onSave = jest.fn();
    const { result } = renderHook(() => useItemFormState({ onSave }), { wrapper });
    act(() => result.current.handleBrandSelect('Shimano'));
    act(() => result.current.setModel('XTR 1500'));
    expect(result.current.nameFieldValue).toBe('Shimano XTR 1500');
  });

  it('toggleGroupId adds and removes group ids', () => {
    const onSave = jest.fn();
    const { result } = renderHook(() => useItemFormState({ onSave }), { wrapper });
    const groupId = 'g1' as GroupId;
    act(() => result.current.toggleGroupId(groupId));
    expect(result.current.groupIds).toEqual([groupId]);
    act(() => result.current.toggleGroupId(groupId));
    expect(result.current.groupIds).toEqual([]);
  });

  it('exposes filteredTagSuggestions filtered by tagInput and excluding existing tags', () => {
    const onSave = jest.fn();
    const { result } = renderHook(() => useItemFormState({ onSave }), { wrapper });
    act(() => result.current.handleAddTag('carbon'));
    act(() => result.current.setTagInput('a'));
    expect(result.current.filteredTagSuggestions).toEqual(['aero']);
  });
});
