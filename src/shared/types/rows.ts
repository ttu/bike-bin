import type { Database } from './database';

/** Convenience aliases for Supabase table row types. */
export type ItemRow = Database['public']['Tables']['items']['Row'];
export type ItemPhotoRow = Database['public']['Tables']['item_photos']['Row'];
export type BikeRow = Database['public']['Tables']['bikes']['Row'];
export type BikePhotoRow = Database['public']['Tables']['bike_photos']['Row'];
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type GroupRow = Database['public']['Tables']['groups']['Row'];
export type GroupMemberRow = Database['public']['Tables']['group_members']['Row'];
export type SavedLocationRow = Database['public']['Tables']['saved_locations']['Row'];
export type MessageRow = Database['public']['Tables']['messages']['Row'];
export type RatingRow = Database['public']['Tables']['ratings']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
