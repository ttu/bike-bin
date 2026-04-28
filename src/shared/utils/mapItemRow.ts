import type {
  AvailabilityType,
  BikeId,
  BorrowDuration,
  GroupId,
  Item,
  ItemCondition,
  ItemId,
  ItemPhoto,
  ItemPhotoId,
  ItemPhotoRow,
  ItemRow,
  ItemStatus,
  LocationId,
  Ownership,
  UserId,
  Visibility,
} from '@/shared/types';

/** Transforms a Supabase row into the Item domain model. */
export function mapItemRow(row: ItemRow): Item {
  const usageKm = row.usage_km ?? undefined;
  const remainingFraction = row.remaining_fraction ?? undefined;
  const rawQty = row.quantity ?? Number.NaN;
  const quantity = Number.isNaN(rawQty) ? 1 : Math.max(1, rawQty);

  const ownership: Ownership =
    row.group_id == null
      ? { ownerId: row.owner_id as UserId }
      : { groupId: row.group_id as GroupId, createdBy: row.created_by as UserId };

  return {
    ...ownership,
    id: row.id as ItemId,
    bikeId: (row.bike_id as BikeId) ?? undefined,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory ?? undefined,
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    description: row.description ?? undefined,
    condition: row.condition as ItemCondition,
    quantity,
    status: row.status as ItemStatus,
    availabilityTypes: (row.availability_types as AvailabilityType[]) ?? [],
    price: row.price ?? undefined,
    deposit: row.deposit ?? undefined,
    borrowDuration: (row.borrow_duration as BorrowDuration) ?? undefined,
    storageLocation: row.storage_location ?? undefined,
    age: row.age ?? undefined,
    usageKm,
    remainingFraction,
    purchaseDate: row.purchase_date ?? undefined,
    mountedDate: row.mounted_date ?? undefined,
    pickupLocationId: (row.pickup_location_id as LocationId) ?? undefined,
    visibility: row.visibility as Visibility,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    tags: row.tags ?? [],
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
