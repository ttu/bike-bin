import {
  createMockUser,
  createMockItem,
  createMockBike,
  createMockLocation,
  createMockConversation,
  createMockMessage,
  createMockBorrowRequest,
  createMockRating,
  createMockGroup,
  createMockSearchResultItem,
  createMockConversationListItem,
  createMockSearchItemsRpcRow,
} from '../factories';

describe('createMockUser', () => {
  it('returns a UserProfile with all required keys', () => {
    const user = createMockUser();
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('displayName');
    expect(user).toHaveProperty('avatarUrl');
    expect(user).toHaveProperty('ratingAvg');
    expect(user).toHaveProperty('ratingCount');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
  });

  it('applies overrides', () => {
    const user = createMockUser({ displayName: 'Test User', ratingCount: 42 });
    expect(user.displayName).toBe('Test User');
    expect(user.ratingCount).toBe(42);
  });

  it('generates unique ids', () => {
    const a = createMockUser();
    const b = createMockUser();
    expect(a.id).not.toBe(b.id);
  });
});

describe('createMockItem', () => {
  it('returns an Item with all required keys', () => {
    const item = createMockItem();
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('ownerId');
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('category');
    expect(item).toHaveProperty('condition');
    expect(item).toHaveProperty('status');
    expect(item).toHaveProperty('availabilityTypes');
    expect(item).toHaveProperty('visibility');
    expect(item).toHaveProperty('createdAt');
    expect(item).toHaveProperty('updatedAt');
  });

  it('availabilityTypes is a non-empty array', () => {
    const item = createMockItem();
    expect(Array.isArray(item.availabilityTypes)).toBe(true);
    expect(item.availabilityTypes.length).toBeGreaterThanOrEqual(1);
  });

  it('applies overrides', () => {
    const item = createMockItem({ name: 'My Tire', price: 19.99 });
    expect(item.name).toBe('My Tire');
    expect(item.price).toBe(19.99);
  });
});

describe('createMockBike', () => {
  it('returns a Bike with all required keys', () => {
    const bike = createMockBike();
    expect(bike).toHaveProperty('id');
    expect(bike).toHaveProperty('ownerId');
    expect(bike).toHaveProperty('name');
    expect(bike).toHaveProperty('type');
    expect(bike).toHaveProperty('createdAt');
    expect(bike).toHaveProperty('updatedAt');
  });

  it('applies overrides', () => {
    const bike = createMockBike({ name: 'Canyon Grail', year: 2023 });
    expect(bike.name).toBe('Canyon Grail');
    expect(bike.year).toBe(2023);
  });
});

describe('createMockLocation', () => {
  it('returns a SavedLocation with all required keys', () => {
    const location = createMockLocation();
    expect(location).toHaveProperty('id');
    expect(location).toHaveProperty('userId');
    expect(location).toHaveProperty('label');
    expect(location).toHaveProperty('isPrimary');
    expect(location).toHaveProperty('createdAt');
  });

  it('applies overrides', () => {
    const location = createMockLocation({ label: 'Workshop', isPrimary: true });
    expect(location.label).toBe('Workshop');
    expect(location.isPrimary).toBe(true);
  });
});

describe('createMockConversation', () => {
  it('returns a Conversation with all required keys', () => {
    const conversation = createMockConversation();
    expect(conversation).toHaveProperty('id');
    expect(conversation).toHaveProperty('itemId');
    expect(conversation).toHaveProperty('createdAt');
  });

  it('applies overrides', () => {
    const conversation = createMockConversation({ itemId: undefined });
    expect(conversation.itemId).toBeUndefined();
  });
});

describe('createMockMessage', () => {
  it('returns a Message with all required keys', () => {
    const message = createMockMessage();
    expect(message).toHaveProperty('id');
    expect(message).toHaveProperty('conversationId');
    expect(message).toHaveProperty('senderId');
    expect(message).toHaveProperty('body');
    expect(message).toHaveProperty('createdAt');
  });

  it('applies overrides', () => {
    const message = createMockMessage({ body: 'Hello there!' });
    expect(message.body).toBe('Hello there!');
  });
});

describe('createMockBorrowRequest', () => {
  it('returns a BorrowRequest with all required keys', () => {
    const request = createMockBorrowRequest();
    expect(request).toHaveProperty('id');
    expect(request).toHaveProperty('itemId');
    expect(request).toHaveProperty('requesterId');
    expect(request).toHaveProperty('status');
    expect(request).toHaveProperty('message');
    expect(request).toHaveProperty('createdAt');
    expect(request).toHaveProperty('updatedAt');
  });

  it('applies overrides', () => {
    const request = createMockBorrowRequest({ status: 'accepted', message: 'Please!' });
    expect(request.status).toBe('accepted');
    expect(request.message).toBe('Please!');
  });
});

describe('createMockRating', () => {
  it('returns a Rating with all required keys', () => {
    const rating = createMockRating();
    expect(rating).toHaveProperty('id');
    expect(rating).toHaveProperty('fromUserId');
    expect(rating).toHaveProperty('toUserId');
    expect(rating).toHaveProperty('itemId');
    expect(rating).toHaveProperty('transactionType');
    expect(rating).toHaveProperty('score');
    expect(rating).toHaveProperty('text');
    expect(rating).toHaveProperty('editableUntil');
    expect(rating).toHaveProperty('createdAt');
    expect(rating).toHaveProperty('updatedAt');
  });

  it('score is between 1 and 5', () => {
    for (let i = 0; i < 10; i++) {
      const rating = createMockRating();
      expect(rating.score).toBeGreaterThanOrEqual(1);
      expect(rating.score).toBeLessThanOrEqual(5);
    }
  });

  it('applies overrides', () => {
    const rating = createMockRating({ score: 5, text: 'Great!' });
    expect(rating.score).toBe(5);
    expect(rating.text).toBe('Great!');
  });
});

describe('createMockGroup', () => {
  it('returns a Group with all required keys', () => {
    const group = createMockGroup();
    expect(group).toHaveProperty('id');
    expect(group).toHaveProperty('name');
    expect(group).toHaveProperty('description');
    expect(group).toHaveProperty('isPublic');
    expect(group).toHaveProperty('createdAt');
  });

  it('applies overrides', () => {
    const group = createMockGroup({ name: 'Berlin Cyclists', isPublic: false });
    expect(group.name).toBe('Berlin Cyclists');
    expect(group.isPublic).toBe(false);
  });
});

describe('createMockSearchResultItem', () => {
  it('returns deterministic fields with overrides', () => {
    const item = createMockSearchResultItem({ name: 'Tire' });
    expect(item.name).toBe('Tire');
    expect(item.ownerDisplayName).toBe('Alice');
  });
});

describe('createMockConversationListItem', () => {
  it('returns deterministic fields with overrides', () => {
    const row = createMockConversationListItem({ unreadCount: 2 });
    expect(row.unreadCount).toBe(2);
    expect(row.otherParticipantName).toBe('Alice');
  });
});

describe('createMockSearchItemsRpcRow', () => {
  it('includes distance_meters and applies overrides', () => {
    const row = createMockSearchItemsRpcRow({ owner_id: 'x' });
    expect(row.owner_id).toBe('x');
    expect(row.distance_meters).toBe(1500);
  });
});
