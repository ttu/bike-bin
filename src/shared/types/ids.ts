declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type ItemId = Brand<string, 'ItemId'>;
export type BikeId = Brand<string, 'BikeId'>;
export type GroupId = Brand<string, 'GroupId'>;
export type ConversationId = Brand<string, 'ConversationId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type LocationId = Brand<string, 'LocationId'>;
export type BorrowRequestId = Brand<string, 'BorrowRequestId'>;
export type RatingId = Brand<string, 'RatingId'>;
export type NotificationId = Brand<string, 'NotificationId'>;
export type ItemPhotoId = Brand<string, 'ItemPhotoId'>;
export type ReportId = Brand<string, 'ReportId'>;
export type SupportRequestId = Brand<string, 'SupportRequestId'>;
