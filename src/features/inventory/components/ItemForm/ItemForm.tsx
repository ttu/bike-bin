import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text, TextInput, Chip, Button, HelperText, Menu, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { AppTheme } from '@/shared/theme';
import { GradientButton } from '@/shared/components/GradientButton';
import { useTranslation } from 'react-i18next';
import { ItemCategory, ItemCondition, AvailabilityType, Visibility } from '@/shared/types';
import type { GroupId } from '@/shared/types';
import { spacing, borderRadius } from '@/shared/theme';

import { validateItem, type ItemFormData, type ItemFormErrors } from '../../utils/validation';
import { useUserTags } from '../../hooks/useUserTags';
import { canAddTag, sanitizeTag } from '../../utils/tagUtils';
import { useGroups } from '@/features/groups';
import type { GroupWithRole } from '@/features/groups';
import { useItems } from '../../hooks/useItems';
import {
  SUBCATEGORIES,
  SUBCATEGORY_ICONS,
  DEFAULT_BRANDS,
  AGE_OPTIONS,
  DURATION_OPTIONS,
} from '../../constants';
import { useDistanceUnit } from '@/features/profile';

const CATEGORIES = [
  ItemCategory.Component,
  ItemCategory.Tool,
  ItemCategory.Accessory,
  ItemCategory.Consumable,
  ItemCategory.Clothing,
];
const CONDITIONS = [
  ItemCondition.New,
  ItemCondition.Good,
  ItemCondition.Worn,
  ItemCondition.Broken,
];
const CONDITION_ICONS: Record<string, string> = {
  new: 'shield-check',
  good: 'emoticon-happy-outline',
  worn: 'history',
  broken: 'close-circle-outline',
};
const AVAILABILITY_OPTIONS = [
  AvailabilityType.Borrowable,
  AvailabilityType.Donatable,
  AvailabilityType.Sellable,
  AvailabilityType.Private,
];

interface ItemFormProps {
  initialData?: ItemFormData;
  initialCategory?: ItemCategory;
  onSave: (data: ItemFormData) => void;
  onDelete?: () => void;
  isSubmitting: boolean;
  isEditMode?: boolean;
  headerComponent?: React.ReactNode;
  photoSection?: React.ReactNode;
}

export function ItemForm({
  initialData,
  initialCategory,
  onSave,
  onDelete,
  isSubmitting,
  isEditMode = false,
  headerComponent,
  photoSection,
}: ItemFormProps) {
  const theme = useTheme<AppTheme>();

  const softInputStyle = {
    backgroundColor: theme.customColors.surfaceContainerHighest,
    borderRadius: 12,
  };
  const underlineColor = theme.colors.outlineVariant + '26';
  const activeUnderlineColor = theme.colors.primary;
  const { t } = useTranslation('inventory');
  const { data: userGroups } = useGroups();
  const { data: existingItems } = useItems();

  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState<ItemCategory | undefined>(
    initialData?.category ?? initialCategory,
  );
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
  const { distanceUnit } = useDistanceUnit();
  const [durationMenuVisible, setDurationMenuVisible] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>(
    initialData?.visibility ?? Visibility.Private,
  );
  const [groupIds, setGroupIds] = useState<GroupId[]>(initialData?.groupIds ?? []);
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestionsVisible, setTagSuggestionsVisible] = useState(false);
  const { data: userTags } = useUserTags();
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

  const filteredTagSuggestions = useMemo(() => {
    if (!userTags || !tagInput.trim()) return [];
    const q = tagInput.toLowerCase();
    return userTags.filter(
      (t) =>
        t.toLowerCase().includes(q) &&
        !tags.some((existing) => existing.toLowerCase() === t.toLowerCase()),
    );
  }, [userTags, tagInput, tags]);

  const handleAddTag = useCallback(
    (rawInput: string) => {
      const tag = sanitizeTag(rawInput);
      if (canAddTag(tag, tags)) {
        setTags((prev) => [...prev, tag]);
      }
      setTagInput('');
      setTagSuggestionsVisible(false);
    },
    [tags],
  );

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
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
      usageUnit: usageKm ? distanceUnit : undefined,
      visibility,
      groupIds: visibility === Visibility.Groups ? groupIds : undefined,
      tags,
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
    distanceUnit,
    visibility,
    groupIds,
    tags,
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
      {headerComponent}

      {photoSection}

      {/* Name */}
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.nameLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={name}
        onChangeText={setName}
        placeholder={t('form.namePlaceholder')}
        error={!!errors.name}
        style={softInputStyle}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />
      {errors.name && (
        <HelperText type="error" visible>
          {errors.name}
        </HelperText>
      )}

      {/* Category */}
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.categoryLabel')}
      </Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <Chip
              key={cat}
              selected={active}
              onPress={() => handleCategoryChange(cat)}
              showSelectedCheck={false}
              textStyle={active ? { color: theme.colors.onPrimary } : undefined}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.colors.primary : theme.colors.secondaryContainer,
                },
              ]}
            >
              {t(`category.${cat}`)}
            </Chip>
          );
        })}
      </View>
      {errors.category && (
        <HelperText type="error" visible>
          {errors.category}
        </HelperText>
      )}

      {/* Subcategory */}
      {category && currentSubcategories.length > 0 && (
        <>
          <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
            {t('form.subcategoryLabel')}
          </Text>
          <View style={styles.subcategoryGrid}>
            {currentSubcategories.map((sub) => {
              const active = subcategory === sub;
              const subIcon = SUBCATEGORY_ICONS[sub];
              return (
                <Pressable
                  key={sub}
                  onPress={() => setSubcategory(active ? '' : sub)}
                  style={[
                    styles.subcategoryCard,
                    {
                      flexBasis: '47%',
                      flexGrow: 1,
                      backgroundColor: active
                        ? theme.colors.primary
                        : theme.customColors.surfaceContainerLow,
                      borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                      borderWidth: active ? 2 : 1,
                    },
                  ]}
                >
                  {subIcon && (
                    <MaterialCommunityIcons
                      name={subIcon as never}
                      size={22}
                      color={active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
                    />
                  )}
                  <Text
                    variant="labelMedium"
                    style={{
                      color: active ? theme.colors.onPrimary : theme.colors.onSurface,
                    }}
                  >
                    {t(`subcategory.${sub}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {/* Condition */}
      <View style={styles.conditionHeader}>
        <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
          {t('form.conditionLabel')}
        </Text>
        {condition && (
          <Text
            variant="labelMedium"
            style={[styles.conditionValue, { color: theme.colors.primary }]}
          >
            {t(`condition.${condition}`)}
          </Text>
        )}
      </View>
      <View style={styles.conditionRow}>
        {CONDITIONS.map((cond) => {
          const active = condition === cond;
          return (
            <Pressable
              key={cond}
              onPress={() => setCondition(cond)}
              style={[
                styles.conditionButton,
                {
                  backgroundColor: active
                    ? theme.colors.primary + '14'
                    : theme.customColors.surfaceContainerLow,
                  borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
                  borderWidth: active ? 2 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={(CONDITION_ICONS[cond] ?? 'shield-check') as never}
                size={28}
                color={active ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <Text
                variant="labelSmall"
                style={{
                  color: active ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginTop: spacing.xs,
                }}
              >
                {t(`condition.${cond}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {errors.condition && (
        <HelperText type="error" visible>
          {errors.condition}
        </HelperText>
      )}

      {/* Brand with suggestions */}
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.brandLabel')}
      </Text>
      <View style={styles.autocompleteWrapper}>
        <TextInput
          mode="flat"
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
          style={softInputStyle}
          underlineColor={underlineColor}
          activeUnderlineColor={activeUnderlineColor}
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

      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.modelLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={model}
        onChangeText={setModel}
        placeholder={t('form.modelPlaceholder')}
        style={softInputStyle}
        underlineColor={underlineColor}
        activeUnderlineColor={activeUnderlineColor}
      />

      {/* Availability */}
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.availabilityLabel')}
      </Text>
      <View style={styles.chipRow}>
        {AVAILABILITY_OPTIONS.map((type) => (
          <Chip
            key={type}
            selected={availabilityTypes.includes(type)}
            onPress={() => toggleAvailability(type)}
            showSelectedCheck={false}
            textStyle={
              availabilityTypes.includes(type) ? { color: theme.colors.onPrimary } : undefined
            }
            style={[
              styles.chip,
              {
                backgroundColor: availabilityTypes.includes(type)
                  ? theme.colors.primary
                  : theme.colors.secondaryContainer,
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
          <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
            {t('form.priceLabel')}
          </Text>
          <TextInput
            mode="flat"
            value={price}
            onChangeText={setPrice}
            placeholder={t('form.pricePlaceholder')}
            keyboardType="decimal-pad"
            error={!!errors.price}
            style={softInputStyle}
            underlineColor={underlineColor}
            activeUnderlineColor={activeUnderlineColor}
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
          <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
            {t('form.depositLabel')}
          </Text>
          <TextInput
            mode="flat"
            value={deposit}
            onChangeText={setDeposit}
            placeholder={t('form.depositPlaceholder')}
            keyboardType="decimal-pad"
            style={softInputStyle}
            underlineColor={underlineColor}
            activeUnderlineColor={activeUnderlineColor}
          />

          {/* Duration selector */}
          <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
            {t('form.durationLabel')}
          </Text>
          <Menu
            visible={durationMenuVisible}
            onDismiss={() => setDurationMenuVisible(false)}
            anchor={
              <Pressable onPress={() => setDurationMenuVisible(true)}>
                <TextInput
                  mode="flat"
                  value={
                    borrowDuration
                      ? t(`form.durationOption.${borrowDuration}`, { defaultValue: borrowDuration })
                      : ''
                  }
                  editable={false}
                  placeholder={t('form.durationPlaceholder')}
                  right={<TextInput.Icon icon="chevron-down" />}
                  pointerEvents="none"
                  style={softInputStyle}
                  underlineColor={underlineColor}
                  activeUnderlineColor={activeUnderlineColor}
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
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.visibilityLabel')}
      </Text>
      <View style={styles.chipRow}>
        <Chip
          selected={visibility === Visibility.All}
          onPress={() => setVisibility(Visibility.All)}
          showSelectedCheck={false}
          textStyle={visibility === Visibility.All ? { color: theme.colors.onPrimary } : undefined}
          style={[
            styles.chip,
            {
              backgroundColor:
                visibility === Visibility.All
                  ? theme.colors.primary
                  : theme.colors.secondaryContainer,
            },
          ]}
        >
          {t('form.visibilityAll')}
        </Chip>
        <Chip
          selected={visibility === Visibility.Groups}
          onPress={() => setVisibility(Visibility.Groups)}
          showSelectedCheck={false}
          textStyle={
            visibility === Visibility.Groups ? { color: theme.colors.onPrimary } : undefined
          }
          style={[
            styles.chip,
            {
              backgroundColor:
                visibility === Visibility.Groups
                  ? theme.colors.primary
                  : theme.colors.secondaryContainer,
            },
          ]}
        >
          {t('form.visibilityGroups')}
        </Chip>
        <Chip
          selected={visibility === Visibility.Private}
          onPress={() => setVisibility(Visibility.Private)}
          showSelectedCheck={false}
          textStyle={
            visibility === Visibility.Private ? { color: theme.colors.onPrimary } : undefined
          }
          style={[
            styles.chip,
            {
              backgroundColor:
                visibility === Visibility.Private
                  ? theme.colors.primary
                  : theme.colors.secondaryContainer,
            },
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
                  showSelectedCheck={false}
                  textStyle={
                    groupIds.includes(group.id) ? { color: theme.colors.onPrimary } : undefined
                  }
                  style={[
                    styles.chip,
                    {
                      backgroundColor: groupIds.includes(group.id)
                        ? theme.colors.primary
                        : theme.colors.secondaryContainer,
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
          <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
            {t('form.ageLabel')}
          </Text>
          <Menu
            visible={ageMenuVisible}
            onDismiss={() => setAgeMenuVisible(false)}
            anchor={
              <Pressable onPress={() => setAgeMenuVisible(true)}>
                <TextInput
                  mode="flat"
                  value={age ? t(`form.ageOption.${age}`, { defaultValue: age }) : ''}
                  editable={false}
                  placeholder={t('form.agePlaceholder')}
                  right={<TextInput.Icon icon="chevron-down" />}
                  pointerEvents="none"
                  style={softInputStyle}
                  underlineColor={underlineColor}
                  activeUnderlineColor={activeUnderlineColor}
                />
              </Pressable>
            }
          >
            <Menu.Item
              title={t('form.ageNotSpecified')}
              onPress={() => {
                setAge('');
                setAgeMenuVisible(false);
              }}
            />
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

          {/* Usage */}
          <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
            {t('form.usageLabel')}
          </Text>
          <View style={styles.usageRow}>
            <TextInput
              mode="flat"
              value={usageKm}
              onChangeText={setUsageKm}
              placeholder={t('form.usagePlaceholder')}
              keyboardType="numeric"
              style={[softInputStyle, styles.usageInput]}
              underlineColor={underlineColor}
              activeUnderlineColor={activeUnderlineColor}
            />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {distanceUnit}
            </Text>
          </View>

          {/* Storage location with suggestions */}
          <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
            {t('form.storageLabel')}
          </Text>
          <View style={styles.autocompleteWrapper}>
            <TextInput
              mode="flat"
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
              style={softInputStyle}
              underlineColor={underlineColor}
              activeUnderlineColor={activeUnderlineColor}
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

          <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
            {t('form.descriptionLabel')}
          </Text>
          <TextInput
            mode="flat"
            value={description}
            onChangeText={setDescription}
            placeholder={t('form.descriptionPlaceholder')}
            multiline
            numberOfLines={3}
            style={softInputStyle}
            underlineColor={underlineColor}
            activeUnderlineColor={activeUnderlineColor}
          />

          {/* Tags */}
          <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
            {t('form.tagsLabel')}
          </Text>
          {tags.length > 0 && (
            <View style={styles.chipRow}>
              {tags.map((tag) => (
                <Chip key={tag} onClose={() => handleRemoveTag(tag)} style={styles.chip} compact>
                  {tag}
                </Chip>
              ))}
            </View>
          )}
          <View style={styles.autocompleteWrapper}>
            <TextInput
              mode="flat"
              value={tagInput}
              onChangeText={(text) => {
                if (text.endsWith(',')) {
                  handleAddTag(text.slice(0, -1));
                  return;
                }
                setTagInput(text);
                setTagSuggestionsVisible(
                  text.trim().length > 0 && filteredTagSuggestions.length > 0,
                );
              }}
              onFocus={() => {
                if (tagInput.trim() && filteredTagSuggestions.length > 0) {
                  setTagSuggestionsVisible(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setTagSuggestionsVisible(false), 200);
              }}
              onSubmitEditing={() => handleAddTag(tagInput)}
              placeholder={t('form.tagsPlaceholder')}
              style={softInputStyle}
              underlineColor={underlineColor}
              activeUnderlineColor={activeUnderlineColor}
              returnKeyType="done"
            />
            {tagSuggestionsVisible && filteredTagSuggestions.length > 0 && (
              <View
                style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface }]}
              >
                <ScrollView
                  style={styles.suggestionsList}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {filteredTagSuggestions.map((suggestion) => (
                    <Pressable
                      key={suggestion}
                      onPress={() => handleAddTag(suggestion)}
                      style={({ pressed }) => [
                        styles.suggestionItem,
                        pressed && { backgroundColor: theme.colors.surfaceVariant },
                      ]}
                    >
                      <Text variant="bodyMedium">{suggestion}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Save */}
      <GradientButton
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        icon={isEditMode ? 'check-circle-outline' : undefined}
        style={styles.saveButton}
      >
        {isEditMode ? t('form.updateInventory') : t('form.save')}
      </GradientButton>

      {/* Delete (edit mode) */}
      {onDelete && (
        <Button
          mode="text"
          onPress={onDelete}
          textColor={theme.colors.error}
          style={styles.deleteButton}
        >
          {t('removeFromBin')}
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
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: borderRadius.full,
  },
  subcategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  subcategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conditionValue: {
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  conditionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  conditionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
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
    marginTop: spacing.xl,
  },
  deleteButton: {
    marginTop: spacing.md,
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
});
