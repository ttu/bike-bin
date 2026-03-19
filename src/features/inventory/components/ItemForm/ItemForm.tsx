import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, TextInput, Chip, Button, HelperText, Menu, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ItemCategory, ItemCondition, AvailabilityType, Visibility } from '@/shared/types';
import type { GroupId } from '@/shared/types';
import { spacing, borderRadius } from '@/shared/theme';
import { validateItem, type ItemFormData, type ItemFormErrors } from '../../utils/validation';
import { useGroups } from '@/features/groups';
import type { GroupWithRole } from '@/features/groups';
import { useItems } from '../../hooks/useItems';
import {
  SUBCATEGORIES,
  DEFAULT_BRANDS,
  AGE_OPTIONS,
  DURATION_OPTIONS,
  DistanceUnit,
} from '../../constants';

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
  const { data: existingItems } = useItems();

  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState<ItemCategory | undefined>(initialData?.category);
  const [subcategory, setSubcategory] = useState(initialData?.subcategory ?? '');
  const [condition, setCondition] = useState<ItemCondition | undefined>(initialData?.condition);
  const [brand, setBrand] = useState(initialData?.brand ?? '');
  const [brandMenuVisible, setBrandMenuVisible] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [model, setModel] = useState(initialData?.model ?? '');
  const [availabilityTypes, setAvailabilityTypes] = useState<AvailabilityType[]>(
    initialData?.availabilityTypes ?? [],
  );
  const [price, setPrice] = useState(initialData?.price?.toString() ?? '');
  const [deposit, setDeposit] = useState(initialData?.deposit?.toString() ?? '');
  const [borrowDuration, setBorrowDuration] = useState(initialData?.borrowDuration ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [storageLocation, setStorageLocation] = useState(initialData?.storageLocation ?? '');
  const [storageMenuVisible, setStorageMenuVisible] = useState(false);
  const [age, setAge] = useState(initialData?.age ?? '');
  const [ageMenuVisible, setAgeMenuVisible] = useState(false);
  const [usageKm, setUsageKm] = useState(initialData?.usageKm?.toString() ?? '');
  const [usageUnit, setUsageUnit] = useState<string>(initialData?.usageUnit ?? DistanceUnit.Km);
  const [durationMenuVisible, setDurationMenuVisible] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>(
    initialData?.visibility ?? Visibility.Private,
  );
  const [groupIds, setGroupIds] = useState<GroupId[]>(initialData?.groupIds ?? []);
  const [showOptional, setShowOptional] = useState(false);
  const [errors, setErrors] = useState<ItemFormErrors>({});

  // Derive unique storage locations from user's existing items
  const existingStorageLocations = useMemo(() => {
    if (!existingItems) return [];
    const locations = existingItems
      .map((item) => item.storageLocation)
      .filter((loc): loc is string => !!loc);
    return [...new Set(locations)].sort();
  }, [existingItems]);

  // Filter brands based on search input
  const filteredBrands = useMemo(() => {
    const search = brandSearch.toLowerCase();
    if (!search) return [...DEFAULT_BRANDS];
    return DEFAULT_BRANDS.filter((b) => b.toLowerCase().includes(search));
  }, [brandSearch]);

  // Get subcategories for selected category
  const currentSubcategories = useMemo(() => {
    if (!category) return [];
    return SUBCATEGORIES[category] ?? [];
  }, [category]);

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

  const handleCategoryChange = useCallback((cat: ItemCategory) => {
    setCategory(cat);
    setSubcategory(''); // Reset subcategory when category changes
  }, []);

  const handleBrandSelect = useCallback((selectedBrand: string) => {
    setBrand(selectedBrand);
    setBrandSearch('');
    setBrandMenuVisible(false);
  }, []);

  const handleBrandInputChange = useCallback((text: string) => {
    setBrand(text);
    setBrandSearch(text);
    if (text.length > 0) {
      setBrandMenuVisible(true);
    } else {
      setBrandMenuVisible(false);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const formData: ItemFormData = {
      name,
      category,
      subcategory: subcategory || undefined,
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
      usageUnit: usageKm ? usageUnit : undefined,
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
    subcategory,
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
    usageUnit,
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
      keyboardShouldPersistTaps="handled"
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
            onPress={() => handleCategoryChange(cat)}
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

      {/* Subcategory */}
      {category && currentSubcategories.length > 0 && (
        <>
          <Text variant="labelLarge" style={styles.label}>
            {t('form.subcategoryLabel')}
          </Text>
          <View style={styles.chipRow}>
            {currentSubcategories.map((sub) => (
              <Chip
                key={sub}
                selected={subcategory === sub}
                onPress={() => setSubcategory(subcategory === sub ? '' : sub)}
                style={[
                  styles.chip,
                  subcategory === sub && { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                {t(`subcategory.${sub}`)}
              </Chip>
            ))}
          </View>
        </>
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

      {/* Brand with suggestions */}
      <Text variant="labelLarge" style={styles.label}>
        {t('form.brandLabel')}
      </Text>
      <View style={styles.autocompleteWrapper}>
        <TextInput
          mode="outlined"
          value={brand}
          onChangeText={handleBrandInputChange}
          onFocus={() => {
            if (brand.length > 0) setBrandMenuVisible(true);
          }}
          onBlur={() => {
            // Delay to allow menu item press to register
            setTimeout(() => setBrandMenuVisible(false), 200);
          }}
          placeholder={t('form.brandPlaceholder')}
        />
        {brandMenuVisible && filteredBrands.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface }]}>
            <ScrollView
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {filteredBrands.slice(0, 8).map((b) => (
                <Pressable
                  key={b}
                  onPress={() => handleBrandSelect(b)}
                  style={({ pressed }) => [
                    styles.suggestionItem,
                    pressed && { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Text variant="bodyMedium">{b}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

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

          {/* Duration selector */}
          <Text variant="labelLarge" style={styles.label}>
            {t('form.durationLabel')}
          </Text>
          <Menu
            visible={durationMenuVisible}
            onDismiss={() => setDurationMenuVisible(false)}
            anchor={
              <Pressable onPress={() => setDurationMenuVisible(true)}>
                <TextInput
                  mode="outlined"
                  value={
                    borrowDuration
                      ? t(`form.durationOption.${borrowDuration}`, { defaultValue: borrowDuration })
                      : ''
                  }
                  editable={false}
                  placeholder={t('form.durationPlaceholder')}
                  right={<TextInput.Icon icon="chevron-down" />}
                  pointerEvents="none"
                />
              </Pressable>
            }
          >
            {DURATION_OPTIONS.map((opt) => (
              <Menu.Item
                key={opt}
                title={t(`form.durationOption.${opt}`)}
                onPress={() => {
                  setBorrowDuration(opt);
                  setDurationMenuVisible(false);
                }}
              />
            ))}
          </Menu>
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
          {/* Age selector */}
          <Text variant="labelLarge" style={styles.label}>
            {t('form.ageLabel')}
          </Text>
          <Menu
            visible={ageMenuVisible}
            onDismiss={() => setAgeMenuVisible(false)}
            anchor={
              <Pressable onPress={() => setAgeMenuVisible(true)}>
                <TextInput
                  mode="outlined"
                  value={age ? t(`form.ageOption.${age}`, { defaultValue: age }) : ''}
                  editable={false}
                  placeholder={t('form.agePlaceholder')}
                  right={<TextInput.Icon icon="chevron-down" />}
                  pointerEvents="none"
                />
              </Pressable>
            }
          >
            {AGE_OPTIONS.map((opt) => (
              <Menu.Item
                key={opt}
                title={t(`form.ageOption.${opt}`)}
                onPress={() => {
                  setAge(opt);
                  setAgeMenuVisible(false);
                }}
              />
            ))}
          </Menu>

          {/* Usage with unit selector */}
          <Text variant="labelLarge" style={styles.label}>
            {t('form.usageLabel')}
          </Text>
          <View style={styles.usageRow}>
            <TextInput
              mode="outlined"
              value={usageKm}
              onChangeText={setUsageKm}
              placeholder={t('form.usagePlaceholder')}
              keyboardType="numeric"
              style={styles.usageInput}
            />
            <View style={styles.unitToggle}>
              <Chip
                selected={usageUnit === DistanceUnit.Km}
                onPress={() => setUsageUnit(DistanceUnit.Km)}
                style={[
                  styles.unitChip,
                  usageUnit === DistanceUnit.Km && {
                    backgroundColor: theme.colors.primaryContainer,
                  },
                ]}
                compact
              >
                {t('form.usageUnit.km')}
              </Chip>
              <Chip
                selected={usageUnit === DistanceUnit.Mi}
                onPress={() => setUsageUnit(DistanceUnit.Mi)}
                style={[
                  styles.unitChip,
                  usageUnit === DistanceUnit.Mi && {
                    backgroundColor: theme.colors.primaryContainer,
                  },
                ]}
                compact
              >
                {t('form.usageUnit.mi')}
              </Chip>
            </View>
          </View>

          {/* Storage location with suggestions */}
          <Text variant="labelLarge" style={styles.label}>
            {t('form.storageLabel')}
          </Text>
          <View style={styles.autocompleteWrapper}>
            <TextInput
              mode="outlined"
              value={storageLocation}
              onChangeText={(text) => {
                setStorageLocation(text);
                setStorageMenuVisible(text.length > 0 && existingStorageLocations.length > 0);
              }}
              onFocus={() => {
                if (existingStorageLocations.length > 0) setStorageMenuVisible(true);
              }}
              onBlur={() => {
                setTimeout(() => setStorageMenuVisible(false), 200);
              }}
              placeholder={t('form.storagePlaceholder')}
            />
            {storageMenuVisible && existingStorageLocations.length > 0 && (
              <View
                style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface }]}
              >
                <ScrollView
                  style={styles.suggestionsList}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {existingStorageLocations
                    .filter(
                      (loc) =>
                        !storageLocation ||
                        loc.toLowerCase().includes(storageLocation.toLowerCase()),
                    )
                    .map((loc) => (
                      <Pressable
                        key={loc}
                        onPress={() => {
                          setStorageLocation(loc);
                          setStorageMenuVisible(false);
                        }}
                        style={({ pressed }) => [
                          styles.suggestionItem,
                          pressed && { backgroundColor: theme.colors.surfaceVariant },
                        ]}
                      >
                        <Text variant="bodyMedium">{loc}</Text>
                      </Pressable>
                    ))}
                </ScrollView>
              </View>
            )}
          </View>

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
  autocompleteWrapper: {
    zIndex: 10,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    borderRadius: borderRadius.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  usageInput: {
    flex: 1,
  },
  unitToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  unitChip: {
    borderRadius: borderRadius.full,
  },
});
