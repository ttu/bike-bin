import {
  UserId,
  ItemId,
  BikeId,
  GroupId,
  ConversationId,
  MessageId,
  LocationId,
  BorrowRequestId,
  RatingId,
  NotificationId,
  ItemPhotoId,
  BikePhotoId,
  ReportId,
  SupportRequestId,
  ExportRequestId,
} from './ids';
import {
  ItemCategory,
  ItemCondition,
  ItemStatus,
  AvailabilityType,
  Visibility,
  BorrowRequestStatus,
  GroupRole,
  BikeType,
  TransactionType,
  NotificationType,
  DistanceUnit,
  BorrowDuration,
  ExportRequestStatus,
} from './enums';

export interface UserProfile {
  id: UserId;
  displayName: string | undefined;
  avatarUrl: string | undefined;
  distanceUnit: DistanceUnit;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavedLocation {
  id: LocationId;
  userId: UserId;
  label: string;
  areaName: string | undefined;
  postcode: string | undefined;
  coordinates: { latitude: number; longitude: number } | undefined;
  isPrimary: boolean;
  createdAt: string;
}

/** Exclusive ownership arc: an item is owned by either a user or a group. */
export type PersonalOwnership = {
  ownerId: UserId;
  groupId?: never;
  createdBy?: never;
};

export type GroupOwnership = {
  groupId: GroupId;
  createdBy: UserId;
  ownerId?: never;
};

export type Ownership = PersonalOwnership | GroupOwnership;

interface ItemBase {
  id: ItemId;
  bikeId: BikeId | undefined;
  name: string;
  category: ItemCategory;
  subcategory: string | undefined;
  brand: string | undefined;
  model: string | undefined;
  description: string | undefined;
  condition: ItemCondition;
  /** Number of identical units in this row (minimum 1). */
  quantity: number;
  status: ItemStatus;
  availabilityTypes: AvailabilityType[];
  price: number | undefined;
  deposit: number | undefined;
  borrowDuration: BorrowDuration | undefined;
  storageLocation: string | undefined;
  age: string | undefined;
  usageKm: number | undefined;
  /** Consumables only: approximate fraction left (0–1). */
  remainingFraction: number | undefined;
  purchaseDate: string | undefined;
  /** Optional calendar date the part was mounted (not the same as status). */
  mountedDate: string | undefined;
  pickupLocationId: LocationId | undefined;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  thumbnailStoragePath: string | undefined;
}

export type Item = ItemBase & Ownership;

export interface ItemPhoto {
  id: ItemPhotoId;
  itemId: ItemId;
  storagePath: string;
  sortOrder: number;
  createdAt: string;
}

export interface BikePhoto {
  id: BikePhotoId;
  bikeId: BikeId;
  storagePath: string;
  sortOrder: number;
  createdAt: string;
}

export interface Bike {
  id: BikeId;
  ownerId: UserId;
  name: string;
  brand: string | undefined;
  model: string | undefined;
  type: BikeType;
  year: number | undefined;
  /** Total distance ridden (km), if tracked */
  distanceKm: number | undefined;
  /** Total usage hours, if tracked (e.g. service intervals) */
  usageHours: number | undefined;
  /** Overall bike condition (same scale as items) */
  condition: ItemCondition;
  notes: string | undefined;
  thumbnailStoragePath: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: GroupId;
  name: string;
  description: string | undefined;
  isPublic: boolean;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
}

export interface GroupMember {
  groupId: GroupId;
  userId: UserId;
  role: GroupRole;
  joinedAt: string;
}

export interface BorrowRequest {
  id: BorrowRequestId;
  itemId: ItemId;
  requesterId: UserId;
  status: BorrowRequestStatus;
  message: string | undefined;
  /** The admin who acted on status transitions for group-owned items */
  actedBy: UserId | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: ConversationId;
  itemId: ItemId | undefined;
  createdAt: string;
}

export interface Message {
  id: MessageId;
  conversationId: ConversationId;
  senderId: UserId;
  body: string;
  createdAt: string;
}

/** Exclusive recipient arc: a rating targets either a user or a group. */
export type UserRatingRecipient = {
  /** Undefined when the reviewer account was deleted (GDPR anonymization). */
  toUserId: UserId | undefined;
  toGroupId?: never;
};

export type GroupRatingRecipient = {
  toGroupId: GroupId;
  toUserId?: never;
};

export type RatingRecipient = UserRatingRecipient | GroupRatingRecipient;

interface RatingBase {
  id: RatingId;
  /** Undefined when the reviewer account was deleted (GDPR anonymization). */
  fromUserId: UserId | undefined;
  itemId: ItemId | undefined;
  transactionType: TransactionType;
  score: number;
  text: string | undefined;
  editableUntil: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export type Rating = RatingBase & RatingRecipient;

export interface Notification {
  id: NotificationId;
  userId: UserId;
  type: NotificationType;
  title: string;
  body: string | undefined;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface SupportRequest {
  id: SupportRequestId;
  userId: UserId | undefined;
  email: string | undefined;
  subject: string;
  body: string;
  screenshotPath: string | undefined;
  appVersion: string | undefined;
  deviceInfo: string | undefined;
  status: 'open' | 'closed';
  createdAt: string;
}

export type ReportTargetType = 'item' | 'user' | 'item_photo' | 'message';
export type ReportStatus = 'open' | 'reviewed' | 'closed';

export interface Report {
  id: ReportId;
  reporterId: UserId;
  targetType: ReportTargetType;
  targetId: ItemId | UserId | ItemPhotoId | MessageId;
  reason: string;
  text: string | undefined;
  status: ReportStatus;
  createdAt: string;
}

export interface ExportRequest {
  id: ExportRequestId;
  userId: UserId;
  status: ExportRequestStatus;
  storagePath: string | undefined;
  errorMessage: string | undefined;
  expiresAt: string | undefined;
  createdAt: string;
  updatedAt: string;
}
