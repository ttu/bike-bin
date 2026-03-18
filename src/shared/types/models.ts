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
  displayName: string | null;
  avatarUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavedLocation {
  id: LocationId;
  userId: UserId;
  label: string;
  areaName: string | null;
  postcode: string | null;
  coordinates: { latitude: number; longitude: number } | null;
  isPrimary: boolean;
  createdAt: string;
}

export interface Item {
  id: ItemId;
  ownerId: UserId;
  name: string;
  category: ItemCategory;
  brand: string | null;
  model: string | null;
  description: string | null;
  condition: ItemCondition;
  status: ItemStatus;
  availabilityTypes: AvailabilityType[];
  price: number | null;
  deposit: number | null;
  borrowDuration: string | null;
  storageLocation: string | null;
  age: string | null;
  usageKm: number | null;
  purchaseDate: string | null;
  pickupLocationId: LocationId | null;
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
  brand: string | null;
  model: string | null;
  type: BikeType;
  year: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: GroupId;
  name: string;
  description: string | null;
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
  message: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: ConversationId;
  itemId: ItemId | null;
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
  itemId: ItemId | null;
  transactionType: TransactionType;
  score: number;
  text: string | null;
  editableUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: NotificationId;
  userId: UserId;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface SupportRequest {
  id: string;
  userId: UserId | null;
  email: string | null;
  subject: string;
  body: string;
  screenshotPath: string | null;
  appVersion: string | null;
  deviceInfo: string | null;
  status: 'open' | 'closed';
  createdAt: string;
}
