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
} from '@/shared/types';

export function createMockUser(overrides?: Partial<UserProfile>): UserProfile {
  return {
    id: faker.string.uuid() as UserId,
    displayName: faker.person.fullName(),
    avatarUrl: faker.image.avatar(),
    ratingAvg: parseFloat(faker.number.float({ min: 1, max: 5, fractionDigits: 2 }).toFixed(2)),
    ratingCount: faker.number.int({ min: 0, max: 100 }),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
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
    borrowDuration: faker.helpers.maybe(() => `${faker.number.int({ min: 1, max: 30 })} days`),
    storageLocation: faker.helpers.maybe(() => faker.location.city()),
    age: faker.helpers.maybe(() => `${faker.number.int({ min: 1, max: 10 })} years`),
    usageKm: faker.helpers.maybe(() => faker.number.int({ min: 0, max: 10000 })),
    purchaseDate: faker.helpers.maybe(() => faker.date.past().toISOString()),
    pickupLocationId: faker.helpers.maybe(() => faker.string.uuid() as LocationId),
    visibility: faker.helpers.arrayElement(Object.values(Visibility)),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
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
