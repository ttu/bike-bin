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
  ReportId,
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
} from './enums';

export interface UserProfile {
  id: UserId;
  displayName: string | undefined;
  avatarUrl: string | undefined;
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

export interface Item {
  id: ItemId;
  ownerId: UserId;
  bikeId: BikeId | undefined;
  name: string;
  category: ItemCategory;
  brand: string | undefined;
  model: string | undefined;
  description: string | undefined;
  condition: ItemCondition;
  status: ItemStatus;
  availabilityTypes: AvailabilityType[];
  price: number | undefined;
  deposit: number | undefined;
  borrowDuration: string | undefined;
  storageLocation: string | undefined;
  age: string | undefined;
  usageKm: number | undefined;
  purchaseDate: string | undefined;
  pickupLocationId: LocationId | undefined;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

export interface ItemPhoto {
  id: string;
  itemId: ItemId;
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
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: GroupId;
  name: string;
  description: string | undefined;
  isPublic: boolean;
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

export interface Rating {
  id: RatingId;
  fromUserId: UserId;
  toUserId: UserId;
  itemId: ItemId | undefined;
  transactionType: TransactionType;
  score: number;
  text: string | undefined;
  editableUntil: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: NotificationId;
  userId: UserId;
  type: string;
  title: string;
  body: string | undefined;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface SupportRequest {
  id: string;
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

export type ReportTargetType = 'item' | 'user';
export type ReportStatus = 'open' | 'reviewed' | 'closed';

export interface Report {
  id: ReportId;
  reporterId: UserId;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  text: string | undefined;
  status: ReportStatus;
  createdAt: string;
}
