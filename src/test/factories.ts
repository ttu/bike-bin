import { faker } from '@faker-js/faker';
import type {
  UserProfile,
  Item,
  Bike,
  SavedLocation,
  Conversation,
  Message,
  BorrowRequest,
  Rating,
  Group,
  GroupMember,
  Notification,
  SupportRequest,
  Report,
} from '@/shared/types';
import type {
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
  SupportRequestId,
} from '@/shared/types';
import {
  ItemCategory,
  ItemCondition,
  ItemStatus,
  AvailabilityType,
  Visibility,
  BorrowRequestStatus,
  BikeType,
  TransactionType,
  GroupRole,
  DURATION_OPTIONS,
} from '@/shared/types';
import type { ItemRow } from '@/shared/types';
import type { SearchResultItem } from '@/features/search/types';
import type { ConversationListItem } from '@/features/messaging/types';

export function createMockUser(overrides?: Partial<UserProfile>): UserProfile {
  return {
    id: faker.string.uuid() as UserId,
    displayName: faker.person.fullName(),
    avatarUrl: faker.image.avatar(),
    distanceUnit: faker.helpers.arrayElement(['km', 'mi']),
    ratingAvg: parseFloat(faker.number.float({ min: 1, max: 5, fractionDigits: 2 }).toFixed(2)),
    ratingCount: faker.number.int({ min: 0, max: 100 }),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/** Creates a snake_case DB row matching what Supabase returns for items. */
export function createMockItemRow(overrides?: Partial<ItemRow>): ItemRow {
  return {
    id: faker.string.uuid(),
    owner_id: faker.string.uuid(),
    bike_id: null,
    name: faker.commerce.productName(),
    category: faker.helpers.arrayElement(Object.values(ItemCategory)),
    subcategory: null,
    brand: faker.company.name(),
    model: faker.commerce.product(),
    description: faker.lorem.sentence(),
    condition: faker.helpers.arrayElement(Object.values(ItemCondition)),
    status: faker.helpers.arrayElement(Object.values(ItemStatus)),
    availability_types: faker.helpers.arrayElements(Object.values(AvailabilityType), {
      min: 1,
      max: 2,
    }),
    price:
      faker.helpers.maybe(() => faker.number.float({ min: 1, max: 500, fractionDigits: 2 })) ??
      null,
    deposit:
      faker.helpers.maybe(() => faker.number.float({ min: 1, max: 100, fractionDigits: 2 })) ??
      null,
    borrow_duration:
      faker.helpers.maybe(() => `${faker.number.int({ min: 1, max: 30 })} days`) ?? null,
    storage_location: faker.helpers.maybe(() => faker.location.city()) ?? null,
    age: faker.helpers.maybe(() => `${faker.number.int({ min: 1, max: 10 })} years`) ?? null,
    ...(() => {
      const usage_km = faker.helpers.maybe(() => faker.number.int({ min: 0, max: 10000 })) ?? null;
      return {
        usage_km,
        usage_unit: usage_km !== null ? faker.helpers.arrayElement(['km', 'mi'] as const) : null,
      };
    })(),
    remaining_fraction: null,
    quantity: 1,
    purchase_date: faker.helpers.maybe(() => faker.date.past().toISOString().slice(0, 10)) ?? null,
    mounted_date: faker.helpers.maybe(() => faker.date.past().toISOString().slice(0, 10)) ?? null,
    pickup_location_id: faker.helpers.maybe(() => faker.string.uuid()) ?? null,
    visibility: faker.helpers.arrayElement(Object.values(Visibility)),
    tags: [],
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function createMockItem(overrides?: Partial<Item>): Item {
  return {
    id: faker.string.uuid() as ItemId,
    ownerId: faker.string.uuid() as UserId,
    bikeId: undefined,
    name: faker.commerce.productName(),
    category: faker.helpers.arrayElement(Object.values(ItemCategory)),
    subcategory: undefined,
    brand: faker.company.name(),
    model: faker.commerce.product(),
    description: faker.lorem.sentence(),
    condition: faker.helpers.arrayElement(Object.values(ItemCondition)),
    status: faker.helpers.arrayElement(Object.values(ItemStatus)),
    availabilityTypes: faker.helpers.arrayElements(Object.values(AvailabilityType), {
      min: 1,
      max: 2,
    }),
    price: faker.helpers.maybe(() => faker.number.float({ min: 1, max: 500, fractionDigits: 2 })),
    deposit: faker.helpers.maybe(() => faker.number.float({ min: 1, max: 100, fractionDigits: 2 })),
    borrowDuration: faker.helpers.maybe(() => faker.helpers.arrayElement([...DURATION_OPTIONS])),
    storageLocation: faker.helpers.maybe(() => faker.location.city()),
    age: faker.helpers.maybe(() => `${faker.number.int({ min: 1, max: 10 })} years`),
    ...(() => {
      const usage = faker.helpers.maybe(() => faker.number.int({ min: 0, max: 10000 }));
      return {
        usage,
        usageUnit:
          usage !== undefined ? faker.helpers.arrayElement(['km', 'mi'] as const) : undefined,
      };
    })(),
    remainingFraction: undefined,
    quantity: 1,
    purchaseDate: faker.helpers.maybe(() => faker.date.past().toISOString().slice(0, 10)),
    mountedDate: faker.helpers.maybe(() => faker.date.past().toISOString().slice(0, 10)),
    pickupLocationId: faker.helpers.maybe(() => faker.string.uuid() as LocationId),
    visibility: faker.helpers.arrayElement(Object.values(Visibility)),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    tags: [],
    thumbnailStoragePath: undefined,
    ...overrides,
  };
}

export function createMockBike(overrides?: Partial<Bike>): Bike {
  return {
    id: faker.string.uuid() as BikeId,
    ownerId: faker.string.uuid() as UserId,
    name: `${faker.company.name()} ${faker.helpers.arrayElement(Object.values(BikeType))}`,
    brand: faker.company.name(),
    model: faker.commerce.product(),
    type: faker.helpers.arrayElement(Object.values(BikeType)),
    year: faker.helpers.maybe(() => faker.number.int({ min: 2000, max: 2026 })),
    distanceKm: faker.helpers.maybe(() =>
      faker.number.float({ min: 0, max: 15_000, fractionDigits: 1 }),
    ),
    usageHours: faker.helpers.maybe(() =>
      faker.number.float({ min: 0, max: 500, fractionDigits: 1 }),
    ),
    condition: faker.helpers.arrayElement(Object.values(ItemCondition)),
    notes: faker.helpers.maybe(() => faker.lorem.sentence()),
    thumbnailStoragePath: undefined,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function createMockLocation(overrides?: Partial<SavedLocation>): SavedLocation {
  return {
    id: faker.string.uuid() as LocationId,
    userId: faker.string.uuid() as UserId,
    label: faker.helpers.arrayElement(['Home', 'Work', 'Garage', 'Club']),
    areaName: faker.location.city(),
    postcode: faker.location.zipCode(),
    coordinates: {
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
    },
    isPrimary: faker.datatype.boolean(),
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
}

export function createMockConversation(overrides?: Partial<Conversation>): Conversation {
  return {
    id: faker.string.uuid() as ConversationId,
    itemId: faker.helpers.maybe(() => faker.string.uuid() as ItemId),
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
}

export function createMockMessage(overrides?: Partial<Message>): Message {
  return {
    id: faker.string.uuid() as MessageId,
    conversationId: faker.string.uuid() as ConversationId,
    senderId: faker.string.uuid() as UserId,
    body: faker.lorem.sentence(),
    createdAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function createMockBorrowRequest(overrides?: Partial<BorrowRequest>): BorrowRequest {
  return {
    id: faker.string.uuid() as BorrowRequestId,
    itemId: faker.string.uuid() as ItemId,
    requesterId: faker.string.uuid() as UserId,
    status: faker.helpers.arrayElement(Object.values(BorrowRequestStatus)),
    message: faker.helpers.maybe(() => faker.lorem.sentence()),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function createMockRating(overrides?: Partial<Rating>): Rating {
  return {
    id: faker.string.uuid() as RatingId,
    fromUserId: faker.string.uuid() as UserId,
    toUserId: faker.string.uuid() as UserId,
    itemId: faker.helpers.maybe(() => faker.string.uuid() as ItemId),
    transactionType: faker.helpers.arrayElement(Object.values(TransactionType)),
    score: faker.number.int({ min: 1, max: 5 }),
    text: faker.helpers.maybe(() => faker.lorem.sentence()),
    editableUntil: faker.helpers.maybe(() => faker.date.future().toISOString()),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function createMockGroup(overrides?: Partial<Group>): Group {
  return {
    id: faker.string.uuid() as GroupId,
    name: faker.company.name(),
    description: faker.helpers.maybe(() => faker.lorem.sentence()),
    isPublic: faker.datatype.boolean(),
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
}

export function createMockGroupMember(overrides?: Partial<GroupMember>): GroupMember {
  return {
    groupId: faker.string.uuid() as GroupId,
    userId: faker.string.uuid() as UserId,
    role: faker.helpers.arrayElement(Object.values(GroupRole)),
    joinedAt: faker.date.past().toISOString(),
    ...overrides,
  };
}

const NOTIFICATION_TYPES = [
  'new_message',
  'borrow_request_received',
  'borrow_request_accepted',
  'borrow_request_declined',
  'return_reminder',
  'rating_prompt',
] as const;

export function createMockNotification(overrides?: Partial<Notification>): Notification {
  return {
    id: faker.string.uuid() as NotificationId,
    userId: faker.string.uuid() as UserId,
    type: faker.helpers.arrayElement([...NOTIFICATION_TYPES]),
    title: faker.lorem.sentence({ min: 3, max: 6 }),
    body: faker.helpers.maybe(() => faker.lorem.sentence()),
    data: {},
    isRead: faker.datatype.boolean(),
    createdAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function createMockSupportRequest(overrides?: Partial<SupportRequest>): SupportRequest {
  return {
    id: faker.string.uuid() as SupportRequestId,
    userId: faker.helpers.maybe(() => faker.string.uuid() as UserId),
    email: faker.helpers.maybe(() => faker.internet.email()),
    subject: faker.lorem.sentence({ min: 3, max: 8 }),
    body: faker.lorem.paragraph(),
    screenshotPath: faker.helpers.maybe(() => `screenshots/${faker.string.uuid()}.png`),
    appVersion: faker.helpers.maybe(() => faker.system.semver()),
    deviceInfo: faker.helpers.maybe(
      () => `${faker.commerce.product()} / iOS ${faker.number.int({ min: 15, max: 18 })}`,
    ),
    status: faker.helpers.arrayElement(['open', 'closed'] as const),
    createdAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

const REPORT_REASONS = ['spam', 'inappropriate', 'fake_listing', 'harassment', 'other'] as const;

export function createMockReport(overrides?: Partial<Report>): Report {
  return {
    id: faker.string.uuid() as ReportId,
    reporterId: faker.string.uuid() as UserId,
    targetType: faker.helpers.arrayElement(['item', 'user'] as const),
    targetId: faker.string.uuid() as ItemId,
    reason: faker.helpers.arrayElement([...REPORT_REASONS]),
    text: faker.helpers.maybe(() => faker.lorem.sentence()),
    status: faker.helpers.arrayElement(['open', 'reviewed', 'closed'] as const),
    createdAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/** Search listing row with distance — shape returned by search RPC + `createMockItemRow` fields. */
export function createMockSearchItemsRpcRow(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...createMockItemRow({
      id: 'item-1',
      owner_id: 'owner-1',
      name: 'Shimano Cassette',
      category: ItemCategory.Component,
      brand: 'Shimano',
      model: '105 R7000',
      description: 'Good cassette',
      condition: ItemCondition.Good,
      status: ItemStatus.Stored,
      availability_types: [AvailabilityType.Borrowable],
      price: null,
      deposit: null,
      borrow_duration: null,
      visibility: 'all',
      pickup_location_id: 'loc-2',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-15T00:00:00Z',
    }),
    distance_meters: 1500,
    ...overrides,
  };
}

/** Deterministic `SearchResultItem` for component and hook tests. */
export function createMockSearchResultItem(
  overrides?: Partial<SearchResultItem>,
): SearchResultItem {
  return {
    id: 'item-1' as ItemId,
    ownerId: 'owner-1' as UserId,
    name: 'Shimano Cassette',
    category: ItemCategory.Component,
    brand: 'Shimano',
    model: '105 R7000',
    description: 'Good cassette for road bikes',
    condition: ItemCondition.Good,
    quantity: 1,
    availabilityTypes: [AvailabilityType.Borrowable],
    price: undefined,
    deposit: undefined,
    borrowDuration: undefined,
    visibility: 'all',
    pickupLocationId: undefined,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    distanceMeters: 1500,
    ownerDisplayName: 'Alice',
    ownerAvatarUrl: undefined,
    ownerRatingAvg: 4.5,
    ownerRatingCount: 12,
    areaName: 'Berlin Mitte',
    thumbnailStoragePath: undefined,
    ...overrides,
  };
}

/** Deterministic conversation row for list UI tests (matches typical `ConversationCard` data). */
export function createMockConversationListItem(
  overrides?: Partial<ConversationListItem>,
): ConversationListItem {
  return {
    id: 'conv-1' as ConversationId,
    itemId: 'item-1' as ItemId,
    itemOwnerId: 'user-1' as UserId,
    itemName: 'Shimano XT Derailleur',
    itemStatus: 'stored',
    itemAvailabilityTypes: [AvailabilityType.Borrowable],
    itemPhotoPath: undefined,
    otherParticipantId: 'user-2' as UserId,
    otherParticipantName: 'Alice',
    otherParticipantAvatarUrl: undefined,
    lastMessageBody: 'Is this still available?',
    lastMessageSenderId: 'user-2' as UserId,
    lastMessageAt: '2026-01-10T12:00:00.000Z',
    unreadCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
