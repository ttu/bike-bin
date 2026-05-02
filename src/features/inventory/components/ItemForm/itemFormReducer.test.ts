import {
  AvailabilityType,
  ItemCategory,
  ItemCondition,
  Visibility,
  type DistanceUnit,
} from '@/shared/types';
import {
  itemFormReducer,
  makeInitialItemFormState,
  type ItemFormReducerState,
} from './itemFormReducer';

const DEFAULT_DISTANCE_UNIT: DistanceUnit = 'km';

const buildState = (overrides: Partial<ItemFormReducerState> = {}): ItemFormReducerState => ({
  ...makeInitialItemFormState({ distanceUnit: DEFAULT_DISTANCE_UNIT }),
  ...overrides,
});

describe('itemFormReducer', () => {
  describe('makeInitialItemFormState', () => {
    it('defaults to a Private item with quantity 1 and condition New', () => {
      const state = makeInitialItemFormState({ distanceUnit: DEFAULT_DISTANCE_UNIT });

      expect(state.basic.quantityStr).toBe('1');
      expect(state.basic.condition).toBe(ItemCondition.New);
      expect(state.availability.types).toEqual([AvailabilityType.Private]);
      expect(state.visibility.visibility).toBe(Visibility.Private);
      expect(state.tags.list).toEqual([]);
      expect(state.optional.showOptional).toBe(false);
    });

    it('hydrates from initialData when provided', () => {
      const state = makeInitialItemFormState({
        distanceUnit: DEFAULT_DISTANCE_UNIT,
        initialData: {
          name: 'Cassette',
          quantity: 3,
          category: ItemCategory.Component,
          condition: ItemCondition.Worn,
          availabilityTypes: [AvailabilityType.Borrowable],
          visibility: Visibility.Groups,
          purchaseDate: '2024-01-15T00:00:00Z',
          tags: ['steel'],
        },
      });

      expect(state.basic.name).toBe('Cassette');
      expect(state.basic.quantityStr).toBe('3');
      expect(state.basic.category).toBe(ItemCategory.Component);
      expect(state.basic.condition).toBe(ItemCondition.Worn);
      expect(state.availability.types).toEqual([AvailabilityType.Borrowable]);
      expect(state.visibility.visibility).toBe(Visibility.Groups);
      expect(state.optional.purchaseDate).toBe('2024-01-15');
      expect(state.tags.list).toEqual(['steel']);
    });
  });

  describe('changeCategory', () => {
    it('clears subcategory whenever the category changes', () => {
      const state = buildState({
        basic: {
          ...buildState().basic,
          category: ItemCategory.Component,
          subcategory: 'Drivetrain',
        },
      });

      const next = itemFormReducer(state, {
        type: 'changeCategory',
        value: ItemCategory.Tool,
      });

      expect(next.basic.category).toBe(ItemCategory.Tool);
      expect(next.basic.subcategory).toBe('');
    });

    it('clears usage when switching to Consumable, preserves remainingPercentStr', () => {
      const state = buildState({
        optional: {
          ...buildState().optional,
          usage: '500',
          remainingPercentStr: '80',
        },
      });

      const next = itemFormReducer(state, {
        type: 'changeCategory',
        value: ItemCategory.Consumable,
      });

      expect(next.optional.usage).toBe('');
      expect(next.optional.remainingPercentStr).toBe('80');
    });

    it('clears remainingPercentStr when switching away from Consumable, preserves usage', () => {
      const state = buildState({
        basic: { ...buildState().basic, category: ItemCategory.Consumable },
        optional: {
          ...buildState().optional,
          usage: '500',
          remainingPercentStr: '80',
        },
      });

      const next = itemFormReducer(state, {
        type: 'changeCategory',
        value: ItemCategory.Component,
      });

      expect(next.optional.usage).toBe('500');
      expect(next.optional.remainingPercentStr).toBe('');
    });
  });

  describe('toggleAvailability', () => {
    it('turning on Private clears all other types', () => {
      const state = buildState({
        availability: {
          ...buildState().availability,
          types: [AvailabilityType.Borrowable, AvailabilityType.Sellable],
        },
      });

      const next = itemFormReducer(state, {
        type: 'toggleAvailability',
        value: AvailabilityType.Private,
      });

      expect(next.availability.types).toEqual([AvailabilityType.Private]);
    });

    it('toggling Private off when it is the only type leaves an empty list', () => {
      const state = buildState({
        availability: { ...buildState().availability, types: [AvailabilityType.Private] },
      });

      const next = itemFormReducer(state, {
        type: 'toggleAvailability',
        value: AvailabilityType.Private,
      });

      expect(next.availability.types).toEqual([]);
    });

    it('selecting any non-private type removes Private', () => {
      const state = buildState({
        availability: { ...buildState().availability, types: [AvailabilityType.Private] },
      });

      const next = itemFormReducer(state, {
        type: 'toggleAvailability',
        value: AvailabilityType.Borrowable,
      });

      expect(next.availability.types).toEqual([AvailabilityType.Borrowable]);
    });

    it('toggling an existing non-private type removes only that type', () => {
      const state = buildState({
        availability: {
          ...buildState().availability,
          types: [AvailabilityType.Borrowable, AvailabilityType.Sellable],
        },
      });

      const next = itemFormReducer(state, {
        type: 'toggleAvailability',
        value: AvailabilityType.Sellable,
      });

      expect(next.availability.types).toEqual([AvailabilityType.Borrowable]);
    });
  });

  describe('addTag', () => {
    it('trims, appends, and clears the input', () => {
      const state = buildState({
        tags: { list: ['existing'], input: '  New Tag  ', suggestionsVisible: true },
      });

      const next = itemFormReducer(state, { type: 'addTag', value: '  New Tag  ' });

      expect(next.tags.list).toEqual(['existing', 'New Tag']);
      expect(next.tags.input).toBe('');
      expect(next.tags.suggestionsVisible).toBe(false);
    });

    it('does not add a duplicate tag', () => {
      const state = buildState({
        tags: { list: ['carbon'], input: 'carbon', suggestionsVisible: true },
      });

      const next = itemFormReducer(state, { type: 'addTag', value: 'carbon' });

      expect(next.tags.list).toEqual(['carbon']);
      expect(next.tags.input).toBe('');
    });

    it('removeTag drops the tag from the list', () => {
      const state = buildState({
        tags: { list: ['a', 'b', 'c'], input: '', suggestionsVisible: false },
      });

      const next = itemFormReducer(state, { type: 'removeTag', value: 'b' });

      expect(next.tags.list).toEqual(['a', 'c']);
    });
  });

  describe('toggleGroup', () => {
    it('adds and removes group ids', () => {
      const groupA = 'group-a' as never;
      const groupB = 'group-b' as never;

      const start = buildState();
      const added = itemFormReducer(start, { type: 'toggleGroup', value: groupA });
      const both = itemFormReducer(added, { type: 'toggleGroup', value: groupB });
      const removedA = itemFormReducer(both, { type: 'toggleGroup', value: groupA });

      expect(added.visibility.groupIds).toEqual([groupA]);
      expect(both.visibility.groupIds).toEqual([groupA, groupB]);
      expect(removedA.visibility.groupIds).toEqual([groupB]);
    });
  });
});
