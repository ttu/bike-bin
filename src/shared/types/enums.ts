export const ItemCategory = {
  Component: 'component',
  Tool: 'tool',
  Accessory: 'accessory',
  Consumable: 'consumable',
  Clothing: 'clothing',
  Bike: 'bike',
} as const;
export type ItemCategory = (typeof ItemCategory)[keyof typeof ItemCategory];

export const ItemCondition = {
  New: 'new',
  Good: 'good',
  Worn: 'worn',
  Broken: 'broken',
} as const;
export type ItemCondition = (typeof ItemCondition)[keyof typeof ItemCondition];

export const ItemStatus = {
  Stored: 'stored',
  Mounted: 'mounted',
  Loaned: 'loaned',
  Reserved: 'reserved',
  Donated: 'donated',
  Sold: 'sold',
  Archived: 'archived',
} as const;
export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

export const AvailabilityType = {
  Borrowable: 'borrowable',
  Donatable: 'donatable',
  Sellable: 'sellable',
  Private: 'private',
} as const;
export type AvailabilityType = (typeof AvailabilityType)[keyof typeof AvailabilityType];

export const Visibility = {
  Private: 'private',
  Groups: 'groups',
  All: 'all',
} as const;
export type Visibility = (typeof Visibility)[keyof typeof Visibility];

export const BorrowRequestStatus = {
  Pending: 'pending',
  Accepted: 'accepted',
  Rejected: 'rejected',
  Returned: 'returned',
  Cancelled: 'cancelled',
} as const;
export type BorrowRequestStatus = (typeof BorrowRequestStatus)[keyof typeof BorrowRequestStatus];

export const GroupRole = {
  Admin: 'admin',
  Member: 'member',
} as const;
export type GroupRole = (typeof GroupRole)[keyof typeof GroupRole];

export const BikeType = {
  Road: 'road',
  Gravel: 'gravel',
  MTB: 'mtb',
  City: 'city',
  Touring: 'touring',
  Other: 'other',
} as const;
export type BikeType = (typeof BikeType)[keyof typeof BikeType];

export const NotificationType = {
  NewMessage: 'new_message',
  BorrowRequestReceived: 'borrow_request_received',
  BorrowRequestAccepted: 'borrow_request_accepted',
  BorrowRequestDeclined: 'borrow_request_declined',
  ReturnReminder: 'return_reminder',
  RatingPrompt: 'rating_prompt',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const SubscriptionPlan = {
  Free: 'free',
  Paid: 'paid',
} as const;
export type SubscriptionPlan = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

export const SubscriptionStatus = {
  Trialing: 'trialing',
  Active: 'active',
  PastDue: 'past_due',
  Canceled: 'canceled',
  Expired: 'expired',
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const TransactionType = {
  Borrow: 'borrow',
  Donate: 'donate',
  Sell: 'sell',
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const DistanceUnit = {
  Km: 'km',
  Mi: 'mi',
} as const;
export type DistanceUnit = (typeof DistanceUnit)[keyof typeof DistanceUnit];

export const DURATION_OPTIONS = [
  '1_day',
  '2_3_days',
  '1_week',
  '2_weeks',
  '1_month',
  'flexible',
] as const;
export type BorrowDuration = (typeof DURATION_OPTIONS)[number];
