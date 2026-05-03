import { BikeType, ItemCondition } from '@/shared/types';
import { bikeFormReducer, makeInitialBikeFormState } from './bikeFormReducer';

describe('bikeFormReducer', () => {
  describe('makeInitialBikeFormState', () => {
    it('defaults to empty fields with condition New', () => {
      const state = makeInitialBikeFormState();
      expect(state.fields.name).toBe('');
      expect(state.fields.brand).toBe('');
      expect(state.fields.model).toBe('');
      expect(state.fields.type).toBeUndefined();
      expect(state.fields.year).toBe('');
      expect(state.fields.distanceKmStr).toBe('');
      expect(state.fields.usageHoursStr).toBe('');
      expect(state.fields.condition).toBe(ItemCondition.New);
      expect(state.fields.notes).toBe('');
      expect(state.errors).toEqual({});
    });

    it('hydrates from initialData when provided', () => {
      const state = makeInitialBikeFormState({
        name: 'Canyon Grail',
        brand: 'Canyon',
        model: 'Grail',
        type: BikeType.Gravel,
        year: 2024,
        distanceKm: 1500,
        usageHours: 50.5,
        condition: ItemCondition.Worn,
        notes: 'Tubeless',
      });

      expect(state.fields.name).toBe('Canyon Grail');
      expect(state.fields.brand).toBe('Canyon');
      expect(state.fields.model).toBe('Grail');
      expect(state.fields.type).toBe(BikeType.Gravel);
      expect(state.fields.year).toBe('2024');
      expect(state.fields.distanceKmStr).toBe('1500');
      expect(state.fields.usageHoursStr).toBe('50.5');
      expect(state.fields.condition).toBe(ItemCondition.Worn);
      expect(state.fields.notes).toBe('Tubeless');
    });

    it('treats nullish numeric inputs as empty strings', () => {
      const state = makeInitialBikeFormState({
        name: 'X',
        condition: ItemCondition.New,
        // year, distanceKm, usageHours all undefined
      });
      expect(state.fields.year).toBe('');
      expect(state.fields.distanceKmStr).toBe('');
      expect(state.fields.usageHoursStr).toBe('');
    });
  });

  describe('field setters', () => {
    const initial = makeInitialBikeFormState();

    it.each([
      ['setName', 'name'],
      ['setBrand', 'brand'],
      ['setModel', 'model'],
      ['setYear', 'year'],
      ['setDistanceKmStr', 'distanceKmStr'],
      ['setUsageHoursStr', 'usageHoursStr'],
      ['setNotes', 'notes'],
    ] as const)('%s updates fields.%s', (action, field) => {
      const next = bikeFormReducer(initial, { type: action, value: 'hello' });
      expect(next.fields[field]).toBe('hello');
    });

    it('setBikeType updates the type', () => {
      const next = bikeFormReducer(initial, { type: 'setBikeType', value: BikeType.MTB });
      expect(next.fields.type).toBe(BikeType.MTB);
    });

    it('setCondition updates the condition', () => {
      const next = bikeFormReducer(initial, {
        type: 'setCondition',
        value: ItemCondition.Broken,
      });
      expect(next.fields.condition).toBe(ItemCondition.Broken);
    });

    it('setErrors replaces the errors object', () => {
      const next = bikeFormReducer(initial, {
        type: 'setErrors',
        value: { name: 'required' },
      });
      expect(next.errors).toEqual({ name: 'required' });
    });

    it('returns a new state object on each action (immutability)', () => {
      const next = bikeFormReducer(initial, { type: 'setName', value: 'X' });
      expect(next).not.toBe(initial);
      expect(next.fields).not.toBe(initial.fields);
      expect(initial.fields.name).toBe('');
    });
  });
});
