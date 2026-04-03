import type { Item, ItemPhoto } from '@/shared/types';
import type { ItemId, BikeId, UserId, LocationId, ItemPhotoId } from '@/shared/types';
import type { ItemRow, ItemPhotoRow } from '@/shared/types';
import type {
  ItemCategory,
  ItemCondition,
  ItemStatus,
  AvailabilityType,
  Visibility,
  DistanceUnit,
  BorrowDuration,
} from '@/shared/types';

/** Transforms a Supabase row into the Item domain model. */
export function mapItemRow(row: ItemRow): Item {
  const rawUsage = row.usage as number | null | undefined;
  const usage = rawUsage === null || rawUsage === undefined ? undefined : rawUsage;
  const usageUnit =
    usage !== undefined ? ((row.usage_unit as DistanceUnit | null) ?? undefined) : undefined;

  const rawRemaining = row.remaining_fraction as number | null | undefined;
  const remainingFraction =
    rawRemaining === null || rawRemaining === undefined ? undefined : rawRemaining;

  const rawQty = row.quantity as number | null | undefined;
  const quantity =
    rawQty === null || rawQty === undefined || Number.isNaN(rawQty) ? 1 : Math.max(1, rawQty);

  return {
    id: row.id as ItemId,
    ownerId: row.owner_id as UserId,
    bikeId: (row.bike_id as BikeId) ?? undefined,
    name: row.name as string,
    category: row.category as ItemCategory,
    subcategory: (row.subcategory as string) ?? undefined,
    brand: (row.brand as string) ?? undefined,
    model: (row.model as string) ?? undefined,
    description: (row.description as string) ?? undefined,
    condition: row.condition as ItemCondition,
    quantity,
    status: row.status as ItemStatus,
    availabilityTypes: (row.availability_types as AvailabilityType[]) ?? [],
    price: (row.price as number) ?? undefined,
    deposit: (row.deposit as number) ?? undefined,
    borrowDuration: (row.borrow_duration as BorrowDuration) ?? undefined,
    storageLocation: (row.storage_location as string) ?? undefined,
    age: (row.age as string) ?? undefined,
    usage,
    usageUnit,
    remainingFraction,
    purchaseDate: (row.purchase_date as string) ?? undefined,
    mountedDate: (row.mounted_date as string) ?? undefined,
    pickupLocationId: (row.pickup_location_id as LocationId) ?? undefined,
    visibility: row.visibility as Visibility,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    tags: (row.tags as string[]) ?? [],
    thumbnailStoragePath: undefined,
  };
}

/** Transforms a Supabase row into the ItemPhoto domain model. */
export function mapItemPhotoRow(row: ItemPhotoRow): ItemPhoto {
  return {
    id: row.id as ItemPhotoId,
    itemId: row.item_id as ItemId,
    storagePath: row.storage_path as string,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  };
}
