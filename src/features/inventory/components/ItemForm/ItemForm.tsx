import { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Chip, Button, HelperText, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ItemCategory, ItemCondition, AvailabilityType, Visibility } from '@/shared/types';
import type { GroupId } from '@/shared/types';
import { spacing, borderRadius } from '@/shared/theme';
import { validateItem, type ItemFormData, type ItemFormErrors } from '../../utils/validation';
import { useGroups } from '@/features/groups';
import type { GroupWithRole } from '@/features/groups';

const CATEGORIES = [ItemCategory.Component, ItemCategory.Tool, ItemCategory.Accessory];
const CONDITIONS = [
  ItemCondition.New,
  ItemCondition.Good,
  ItemCondition.Worn,
  ItemCondition.Broken,
];
const AVAILABILITY_OPTIONS = [
  AvailabilityType.Borrowable,
  AvailabilityType.Donatable,
  AvailabilityType.Sellable,
  AvailabilityType.Private,
];

interface ItemFormProps {
  initialData?: ItemFormData;
  onSave: (data: ItemFormData) => void;
  onDelete?: () => void;
  isSubmitting: boolean;
}

export function ItemForm({ initialData, onSave, onDelete, isSubmitting }: ItemFormProps) {
  const theme = useTheme();
  const { t } = useTranslation('inventory');
  const { data: userGroups } = useGroups();

  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState<ItemCategory | undefined>(initialData?.category);
  const [condition, setCondition] = useState<ItemCondition | undefined>(initialData?.condition);
  const [brand, setBrand] = useState(initialData?.brand ?? '');
  const [model, setModel] = useState(initialData?.model ?? '');
  const [availabilityTypes, setAvailabilityTypes] = useState<AvailabilityType[]>(
    initialData?.availabilityTypes ?? [],
  );
  const [price, setPrice] = useState(initialData?.price?.toString() ?? '');
  const [deposit, setDeposit] = useState(initialData?.deposit?.toString() ?? '');
  const [borrowDuration, setBorrowDuration] = useState(initialData?.borrowDuration ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [storageLocation, setStorageLocation] = useState(initialData?.storageLocation ?? '');
  const [age, setAge] = useState(initialData?.age ?? '');
  const [usageKm, setUsageKm] = useState(initialData?.usageKm?.toString() ?? '');
  const [visibility, setVisibility] = useState<Visibility>(
    initialData?.visibility ?? Visibility.All,
  );
  const [groupIds, setGroupIds] = useState<GroupId[]>(initialData?.groupIds ?? []);
  const [showOptional, setShowOptional] = useState(false);
  const [errors, setErrors] = useState<ItemFormErrors>({});

  const toggleGroupId = useCallback((id: GroupId) => {
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }, []);

  const isSellable = availabilityTypes.includes(AvailabilityType.Sellable);
  const isBorrowable = availabilityTypes.includes(AvailabilityType.Borrowable);

  const toggleAvailability = useCallback((type: AvailabilityType) => {
    setAvailabilityTypes((prev) => {
      if (type === AvailabilityType.Private) {
        return prev.includes(type) ? [] : [AvailabilityType.Private];
      }
      const filtered = prev.filter((t) => t !== AvailabilityType.Private);
      return filtered.includes(type) ? filtered.filter((t) => t !== type) : [...filtered, type];
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const formData: ItemFormData = {
      name,
      category,
      condition,
      brand: brand || undefined,
      model: model || undefined,
      description: description || undefined,
      availabilityTypes,
      price: isSellable && price ? parseFloat(price) : undefined,
      deposit: isBorrowable && deposit ? parseFloat(deposit) : undefined,
      borrowDuration: isBorrowable && borrowDuration ? borrowDuration : undefined,
      storageLocation: storageLocation || undefined,
      age: age || undefined,
      usageKm: usageKm ? parseInt(usageKm, 10) : undefined,
      visibility,
      groupIds: visibility === Visibility.Groups ? groupIds : undefined,
    };

    const validationErrors = validateItem(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSave(formData);
    }
  }, [
    name,
    category,
    condition,
    brand,
    model,
    description,
    availabilityTypes,
    price,
    deposit,
    borrowDuration,
    storageLocation,
    age,
    usageKm,
    visibility,
    groupIds,
    isSellable,
    isBorrowable,
    onSave,
  ]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Name */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.nameLabel')}
      </Text>
      <TextInput
        mode="outlined"
        value={name}
        onChangeText={setName}
        placeholder={t('form.namePlaceholder')}
        error={!!errors.name}
      />
      {errors.name && (
        <HelperText type="error" visible>
          {errors.name}
        </HelperText>
      )}

      {/* Category */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.categoryLabel')}
      </Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            selected={category === cat}
            onPress={() => setCategory(cat)}
            style={[
              styles.chip,
              category === cat && { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            {t(`category.${cat}`)}
          </Chip>
        ))}
      </View>
      {errors.category && (
        <HelperText type="error" visible>
          {errors.category}
        </HelperText>
      )}

      {/* Condition */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.conditionLabel')}
      </Text>
      <View style={styles.chipRow}>
        {CONDITIONS.map((cond) => (
          <Chip
            key={cond}
            selected={condition === cond}
            onPress={() => setCondition(cond)}
            style={[
              styles.chip,
              condition === cond && { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            {t(`condition.${cond}`)}
          </Chip>
        ))}
      </View>
      {errors.condition && (
        <HelperText type="error" visible>
          {errors.condition}
        </HelperText>
      )}

      {/* Brand & Model */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.brandLabel')}
      </Text>
      <TextInput
        mode="outlined"
        value={brand}
        onChangeText={setBrand}
        placeholder={t('form.brandPlaceholder')}
      />

      <Text variant="labelLarge" style={styles.label}>
        {t('form.modelLabel')}
      </Text>
      <TextInput
        mode="outlined"
        value={model}
        onChangeText={setModel}
        placeholder={t('form.modelPlaceholder')}
      />

      {/* Availability */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.availabilityLabel')}
      </Text>
      <View style={styles.chipRow}>
        {AVAILABILITY_OPTIONS.map((type) => (
          <Chip
            key={type}
            selected={availabilityTypes.includes(type)}
            onPress={() => toggleAvailability(type)}
            style={[
              styles.chip,
              availabilityTypes.includes(type) && {
                backgroundColor: theme.colors.primaryContainer,
              },
            ]}
          >
            {t(`availability.${type}`)}
          </Chip>
        ))}
      </View>

      {/* Conditional: Sellable price */}
      {isSellable && (
        <>
          <Text variant="labelLarge" style={styles.label}>
            {t('form.priceLabel')}
          </Text>
          <TextInput
            mode="outlined"
            value={price}
            onChangeText={setPrice}
            placeholder={t('form.pricePlaceholder')}
            keyboardType="decimal-pad"
            error={!!errors.price}
          />
          {errors.price && (
            <HelperText type="error" visible>
              {errors.price}
            </HelperText>
          )}
        </>
      )}

      {/* Conditional: Borrowable deposit + duration */}
      {isBorrowable && (
        <>
          <Text variant="labelLarge" style={styles.label}>
            {t('form.depositLabel')}
          </Text>
          <TextInput
            mode="outlined"
            value={deposit}
            onChangeText={setDeposit}
            placeholder={t('form.depositPlaceholder')}
            keyboardType="decimal-pad"
          />

          <Text variant="labelLarge" style={styles.label}>
            {t('form.durationLabel')}
          </Text>
          <TextInput
            mode="outlined"
            value={borrowDuration}
            onChangeText={setBorrowDuration}
            placeholder={t('form.durationPlaceholder')}
          />
        </>
      )}

      {/* Visibility */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.visibilityLabel')}
      </Text>
      <View style={styles.chipRow}>
        <Chip
          selected={visibility === Visibility.All}
          onPress={() => setVisibility(Visibility.All)}
          style={[
            styles.chip,
            visibility === Visibility.All && { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          {t('form.visibilityAll')}
        </Chip>
        <Chip
          selected={visibility === Visibility.Groups}
          onPress={() => setVisibility(Visibility.Groups)}
          style={[
            styles.chip,
            visibility === Visibility.Groups && {
              backgroundColor: theme.colors.primaryContainer,
            },
          ]}
        >
          {t('form.visibilityGroups')}
        </Chip>
        <Chip
          selected={visibility === Visibility.Private}
          onPress={() => setVisibility(Visibility.Private)}
          style={[
            styles.chip,
            visibility === Visibility.Private && { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          {t('form.visibilityPrivate')}
        </Chip>
      </View>

      {/* Group selection (when visibility is Groups) */}
      {visibility === Visibility.Groups && (
        <View style={styles.groupSelection}>
          {userGroups && userGroups.length > 0 ? (
            <View style={styles.chipRow}>
              {userGroups.map((group: GroupWithRole) => (
                <Chip
                  key={group.id}
                  selected={groupIds.includes(group.id)}
                  onPress={() => toggleGroupId(group.id)}
                  style={[
                    styles.chip,
                    groupIds.includes(group.id) && {
                      backgroundColor: theme.colors.secondaryContainer,
                    },
                  ]}
                >
                  {group.name}
                </Chip>
              ))}
            </View>
          ) : (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('form.noGroups')}
            </Text>
          )}
          {errors.groupIds && (
            <HelperText type="error" visible>
              {errors.groupIds}
            </HelperText>
          )}
        </View>
      )}

      {/* Optional section */}
      <Button
        mode="text"
        onPress={() => setShowOptional(!showOptional)}
        icon={showOptional ? 'chevron-up' : 'chevron-down'}
        style={styles.optionalToggle}
      >
        {t('form.optionalSection')}
      </Button>

      {showOptional && (
        <View style={styles.optionalSection}>
          <Text variant="labelLarge" style={styles.label}>
            {t('form.ageLabel')}
          </Text>
          <TextInput
            mode="outlined"
            value={age}
            onChangeText={setAge}
            placeholder={t('form.agePlaceholder')}
          />

          <Text variant="labelLarge" style={styles.label}>
            {t('form.usageLabel')}
          </Text>
          <TextInput
            mode="outlined"
            value={usageKm}
            onChangeText={setUsageKm}
            placeholder={t('form.usagePlaceholder')}
            keyboardType="numeric"
          />

          <Text variant="labelLarge" style={styles.label}>
            {t('form.storageLabel')}
          </Text>
          <TextInput
            mode="outlined"
            value={storageLocation}
            onChangeText={setStorageLocation}
            placeholder={t('form.storagePlaceholder')}
          />

          <Text variant="labelLarge" style={styles.label}>
            {t('form.descriptionLabel')}
          </Text>
          <TextInput
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            placeholder={t('form.descriptionPlaceholder')}
            multiline
            numberOfLines={3}
          />
        </View>
      )}

      {/* Save */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.saveButton}
      >
        {t('form.save')}
      </Button>

      {/* Delete (edit mode) */}
      {onDelete && (
        <Button
          mode="outlined"
          onPress={onDelete}
          textColor={theme.colors.error}
          style={styles.deleteButton}
        >
          {t('deleteItem')}
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  label: {
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: borderRadius.full,
  },
  groupSelection: {
    marginTop: spacing.sm,
  },
  optionalToggle: {
    marginTop: spacing.lg,
  },
  optionalSection: {
    marginTop: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
  deleteButton: {
    marginTop: spacing.md,
    borderColor: 'transparent',
  },
});
