import type { ItemCategory } from '@/shared/types';
import { ItemCategory as ItemCategoryEnum } from '@/shared/types';

/**
 * Subcategories grouped by parent category.
 * Keys are ItemCategory values, values are arrays of subcategory keys
 * that map to i18n strings at `subcategory.<key>`.
 */
export const SUBCATEGORIES: Record<ItemCategory, readonly string[]> = {
  [ItemCategoryEnum.Component]: [
    'drivetrain',
    'brakes',
    'wheels',
    'tires_tubes',
    'handlebars_stems',
    'seatposts_saddles',
    'suspension',
    'frames',
    'headsets_bearings',
    'pedals',
    'bottom_brackets',
    'cables_housing',
    'other_component',
  ],
  [ItemCategoryEnum.Tool]: [
    'multi_tools',
    'wrenches',
    'chain_tools',
    'tire_levers',
    'pumps',
    'torque_wrenches',
    'stands',
    'cleaning',
    'measurement',
    'other_tool',
  ],
  [ItemCategoryEnum.Accessory]: [
    'lights',
    'locks',
    'bags_racks',
    'fenders',
    'bottles_cages',
    'computers_gps',
    'bells_mirrors',
    'other_accessory',
  ],
  [ItemCategoryEnum.Consumable]: [
    'chain_lube',
    'grease',
    'degreaser',
    'brake_fluid',
    'tubeless_sealant',
    'thread_locker',
    'anti_seize',
    'polish',
    'other_consumable',
  ],
  [ItemCategoryEnum.Clothing]: [
    'jerseys',
    'shorts_bibs',
    'jackets_vests',
    'gloves',
    'socks',
    'shoes',
    'helmets',
    'eyewear',
    'base_layers',
    'arm_leg_warmers',
    'rain_gear',
    'other_clothing',
  ],
  [ItemCategoryEnum.Bike]: [],
} as const;

/**
 * Default brand suggestions for bike parts.
 * Users can also input custom brands not in this list.
 */
export const DEFAULT_BRANDS = [
  'Shimano',
  'SRAM',
  'Campagnolo',
  'Continental',
  'Schwalbe',
  'Mavic',
  'DT Swiss',
  'Park Tool',
  'Topeak',
  'Brooks',
  'Fizik',
  'FSA',
  'Chris King',
  'Hope',
  'Magura',
  'TRP',
  'Zipp',
  'Enve',
  'Thomson',
  'Ritchey',
  'Bontrager',
  'Giant',
  'Specialized',
  'Trek',
  'Cannondale',
  'Canyon',
  'Santa Cruz',
  'Crank Brothers',
  'Look',
  'SKS',
  'Lezyne',
  'Knog',
  'Ortlieb',
  'Thule',
  'Wahoo',
  'Garmin',
  'RockShox',
  'Fox',
  'Maxxis',
  'Vittoria',
  'WTB',
  'Race Face',
  'Ergon',
  'PRO',
  'Deda',
  'Cinelli',
  '3T',
  'Rotor',
  'Stages',
  'Quarq',
  'Muc-Off',
  'Finish Line',
  "Pedro's",
  'Motorex',
  'Squirt',
  'Silca',
  "Stan's NoTubes",
  'Loctite',
] as const;

/**
 * Predefined age options for selector.
 * Values are i18n keys under `form.ageOption.<key>`.
 */
export const AGE_OPTIONS = [
  'less_than_6_months',
  '6_to_12_months',
  '1_to_2_years',
  '2_to_3_years',
  '3_to_5_years',
  '5_to_10_years',
  'over_10_years',
] as const;

/**
 * Predefined borrow duration options for selector.
 * Values are i18n keys under `form.durationOption.<key>`.
 */
export const DURATION_OPTIONS = [
  '1_day',
  '2_3_days',
  '1_week',
  '2_weeks',
  '1_month',
  'flexible',
] as const;

/**
 * Distance unit options.
 */
export const DistanceUnit = {
  Km: 'km',
  Mi: 'mi',
} as const;
export type DistanceUnit = (typeof DistanceUnit)[keyof typeof DistanceUnit];
