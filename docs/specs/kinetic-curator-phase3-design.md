# Kinetic Curator Phase 3: Glassmorphism, Editorial Layouts & Micro-Interactions

## Goal

Elevate the app's visual sophistication with three upgrades: a translucent glassmorphism tab bar, asymmetric editorial layouts for key screens, and component-level micro-interactions (press feedback, ambient shadows, animated transitions).

## Dependencies

**New packages required:**

- `expo-blur` — BlurView for glassmorphism tab bar
- `react-native-reanimated` — entering/layout animations, press feedback

## D. Glassmorphism Navigation Bar

Replace the solid-surface tab bar with a translucent frosted-glass bar that lets content scroll beneath it.

**Visual spec:**

- Background: `surface` at 80% opacity (append `'CC'` hex alpha)
- Blur: `expo-blur` BlurView with `intensity={20}` and `tint="systemChromeMaterialLight"`
- Shadow: keep existing ambient shadow (`shadowOpacity: 0.06`, `shadowRadius: 24`)
- `borderTopWidth: 0` (already set)
- `position: 'absolute'` so content scrolls underneath
- Dark mode: `tint="systemChromeMaterialDark"`, same 80% opacity

**Implementation:**

- Custom `tabBar` prop on `<Tabs>` component in `app/(tabs)/_layout.tsx`
- Wrap tab bar content in `<BlurView>` from `expo-blur`
- All tab screens need `contentContainerStyle.paddingBottom` increased to account for absolute tab bar height (~85px including safe area)

**Files modified:**

- `app/(tabs)/_layout.tsx` — custom tabBar renderer with BlurView
- `app/(tabs)/inventory/index.tsx` — increase bottom padding
- `app/(tabs)/search/index.tsx` — increase bottom padding
- `app/(tabs)/messages/index.tsx` — increase bottom padding
- `app/(tabs)/profile/index.tsx` — increase bottom padding

## E. Asymmetric Editorial Layouts

Transform the inventory and search screens from uniform lists into editorial-style layouts with hero sections and visual hierarchy.

### E1. Inventory Hero Section

When inventory has items, show the first item as a hero card above the regular list.

**Hero card spec:**

- Full width, image fills card at 16:9 aspect ratio (or placeholder gradient if no photo)
- Title overlaid on bottom-left with semi-transparent gradient scrim
- Text: `headlineSmall` variant, `onPrimary` color
- Status chip positioned top-right
- `borderRadius: 16` (lg)
- Margin bottom: `spacing.lg` (24px)

**Regular list below hero:**

- Unchanged ItemCard layout
- List starts from index 1 (hero takes index 0)

### E2. Search Results — Staggered Two-Column Grid

Replace the single-column search result list with a two-column masonry-style grid for a more editorial feel.

**Grid spec:**

- Two columns with `spacing.sm` (8px) gap
- Cards stack vertically within each column
- Image: full card width, 4:3 aspect ratio
- Below image: name (titleSmall), condition badge, location
- `borderRadius: 12` (md)
- Background: `surfaceContainerLowest`
- Alternate columns: left column gets `marginTop: spacing.lg` (24px) offset to create stagger effect

**Implementation:**

- FlatList with `numColumns={2}` and `columnWrapperStyle`
- New `SearchResultGridCard` component (compact vertical layout vs current horizontal)
- Keep existing `SearchResultCard` for potential list-view toggle later

### E3. Profile — Asymmetric Header

**Profile header spec:**

- Asymmetric padding: `spacing.xl` (32px) top, `spacing.md` (12px) bottom — editorial "pull"
- Avatar: 80px, positioned with slight left offset from center
- Display stat row below avatar: items count, bikes count — using `displaySmall` variant for numbers, `labelMedium` for labels
- Stats use `tertiary` color (#385d8c) for community feel

## F. Component-Level Visual Improvements

### F1. Card Press Feedback

Add subtle scale animation on press for all interactive cards.

**Spec:**

- On press-in: scale to 0.98 over 150ms (ease-out)
- On press-out: scale back to 1.0 over 200ms (ease-in)
- Use `react-native-reanimated` shared values + `useAnimatedStyle`

**Targets:**

- `ItemCard` — inventory items
- `SearchResultCard` — search results (and new `SearchResultGridCard`)
- `ConversationCard` — message threads

### F2. Ambient Card Shadows

Add the Kinetic Curator ambient shadow to all card components.

**Shadow spec (from design system):**

- `shadowColor: onSurface`
- `shadowOffset: { width: 0, height: 4 }`
- `shadowOpacity: 0.04`
- `shadowRadius: 12`
- `elevation: 1` (Android)

**Targets:** Same three card components as F1.

### F3. FlatList Item Entry Animations

Animate list items entering the viewport using Reanimated layout animations.

**Spec:**

- `FadeInUp` entering animation with 300ms duration
- Stagger: each item delays 50ms × index (capped at 10 items to avoid long waits on large lists)
- Applied via `Animated.View` wrapper on list `renderItem`

**Targets:**

- Inventory FlatList
- Search results FlatList
- Messages FlatList

### F4. Photo Gallery Parallax

Add subtle parallax effect to PhotoGallery horizontal scroll.

**Spec:**

- As user scrolls between photos, the current image shifts 10% slower than scroll (parallax ratio 0.9)
- Uses `Animated.ScrollView` from reanimated with `useAnimatedScrollHandler`

## Shared Utility: AnimatedPressable

New shared component wrapping Pressable with Reanimated scale animation.

**File:** `src/shared/components/AnimatedPressable/AnimatedPressable.tsx`

**Props:** Same as React Native `Pressable` + optional `scaleValue` (default 0.98).

Used by ItemCard, SearchResultCard, SearchResultGridCard, ConversationCard.

## Testing

- All existing tests must continue to pass
- Mock `expo-blur` and `react-native-reanimated` in Jest setup
- No new test files — these are visual/animation changes
- SearchResultGridCard gets basic render test

## Files Summary

**New files (3):**

- `src/shared/components/AnimatedPressable/AnimatedPressable.tsx`
- `src/shared/components/AnimatedPressable/index.ts`
- `src/features/search/components/SearchResultGridCard/SearchResultGridCard.tsx`

**Modified files (~12):**

- `package.json` (add expo-blur, react-native-reanimated)
- `jest.config.js` or `jest.setup.js` (add mocks)
- `app/(tabs)/_layout.tsx` (glassmorphism tab bar)
- `app/(tabs)/inventory/index.tsx` (hero section + bottom padding + entry animations)
- `app/(tabs)/search/index.tsx` (two-column grid + bottom padding + entry animations)
- `app/(tabs)/messages/index.tsx` (bottom padding + entry animations)
- `app/(tabs)/profile/index.tsx` (asymmetric header + bottom padding)
- `src/features/inventory/components/ItemCard/ItemCard.tsx` (AnimatedPressable + shadow)
- `src/features/search/components/SearchResultCard/SearchResultCard.tsx` (AnimatedPressable + shadow)
- `src/features/messaging/components/ConversationCard/ConversationCard.tsx` (AnimatedPressable + shadow)
- `src/shared/components/PhotoGallery/PhotoGallery.tsx` (parallax scroll)
- `src/shared/components/index.ts` (export AnimatedPressable)
