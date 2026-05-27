# Location Country Picker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an ISO country selector to `LocationForm` so postcode geocoding is unambiguous — fixing the "postcode search doesn't work" bug for users outside well-disambiguated regions.

**Architecture:** Client-only change. A new `CountryPicker` shared component is rendered above the postcode field in `LocationForm`. The selected ISO 3166-1 alpha-2 code is passed as the second argument to the existing `geocodePostcode(postcode, country)` API, which already forwards it to Nominatim via the `geocode-postcode` Edge Function. Default country comes from `expo-localization`. Country is request-only — not persisted on `saved_locations`.

**Tech Stack:** React Native, Expo (`expo-localization` already installed), TypeScript strict, React Native Paper (MD3), react-i18next, Jest + `@testing-library/react-native`.

**Spec:** `docs/superpowers/specs/2026-05-26-location-country-picker-design.md`

---

## File Structure

| File                                                                             | Status | Responsibility                                                                                    |
| -------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `src/shared/data/countries.ts`                                                   | Create | Static ISO 3166-1 alpha-2 list (`code`, `name`).                                                  |
| `src/shared/data/__tests__/countries.test.ts`                                    | Create | Sanity tests over the static list.                                                                |
| `src/shared/utils/getDefaultCountry.ts`                                          | Create | Read `expo-localization` region, lowercase, fall back to `'fi'`.                                  |
| `src/shared/utils/__tests__/getDefaultCountry.test.ts`                           | Create | Cover the locale-present, missing, and malformed cases.                                           |
| `src/shared/utils/countryFlag.ts`                                                | Create | Convert alpha-2 → unicode regional-indicator flag emoji.                                          |
| `src/shared/utils/__tests__/countryFlag.test.ts`                                 | Create | Spot-check `fi`, `gb`, `us`; verify graceful return for bad input.                                |
| `src/shared/components/CountryPicker/CountryPicker.tsx`                          | Create | Paper-styled trigger + modal with search + `FlatList`.                                            |
| `src/shared/components/CountryPicker/__tests__/CountryPicker.test.tsx`           | Create | Render, open, search, select.                                                                     |
| `src/shared/components/CountryPicker/index.ts`                                   | Create | Public re-export.                                                                                 |
| `src/i18n/en/locations.json`                                                     | Modify | Add three new keys under `form.*`.                                                                |
| `src/features/locations/components/LocationForm/LocationForm.tsx`                | Modify | Add country state + picker; pass country to `geocodePostcode`; auto re-geocode on country change. |
| `src/features/locations/components/LocationForm/__tests__/LocationForm.test.tsx` | Modify | Extend with country-default, country-change, and `geocodePostcode(postcode, country)` cases.      |

---

### Task 1: Static ISO 3166-1 country list

**Files:**

- Create: `src/shared/data/countries.ts`
- Test: `src/shared/data/__tests__/countries.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/shared/data/__tests__/countries.test.ts
import { COUNTRIES } from '../countries';

describe('COUNTRIES', () => {
  it('is non-empty', () => {
    expect(COUNTRIES.length).toBeGreaterThan(200);
  });

  it('uses lowercase 2-letter alpha-2 codes', () => {
    for (const c of COUNTRIES) {
      expect(c.code).toMatch(/^[a-z]{2}$/);
    }
  });

  it('has unique codes', () => {
    const codes = COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('has non-empty English names', () => {
    for (const c of COUNTRIES) {
      expect(c.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('includes well-known countries (fi, gb, us, de)', () => {
    const codes = COUNTRIES.map((c) => c.code);
    for (const code of ['fi', 'gb', 'us', 'de']) {
      expect(codes).toContain(code);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test:unit -- src/shared/data/__tests__/countries.test.ts
```

Expected: FAIL — `Cannot find module '../countries'`.

- [ ] **Step 3: Create the static list**

Create `src/shared/data/countries.ts` exporting `COUNTRIES: ReadonlyArray<{ readonly code: string; readonly name: string }>` covering all ISO 3166-1 alpha-2 entries.

- Use lowercase codes.
- Use the standard English short name (e.g. `"United Kingdom"`, `"United States"`, `"Finland"`).
- Sort alphabetically by `name` so the picker renders in order.
- No external dependency. The list lives in this file as a literal array.
- Type the export as `as const` or with `ReadonlyArray<...>` so consumers can't mutate.

The full list is long; copy from a reliable source (Wikipedia "ISO 3166-1 alpha-2" table) and verify count is ≥ 249.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test:unit -- src/shared/data/__tests__/countries.test.ts
```

Expected: PASS — all five cases green.

- [ ] **Step 5: Commit**

```bash
git add src/shared/data/countries.ts src/shared/data/__tests__/countries.test.ts
git commit -m "feat: static ISO 3166-1 country list"
```

---

### Task 2: Country flag emoji util

**Files:**

- Create: `src/shared/utils/countryFlag.ts`
- Test: `src/shared/utils/__tests__/countryFlag.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/shared/utils/__tests__/countryFlag.test.ts
import { countryFlag } from '../countryFlag';

describe('countryFlag', () => {
  it('returns the Finnish flag for "fi"', () => {
    expect(countryFlag('fi')).toBe('🇫🇮');
  });

  it('returns the UK flag for "gb"', () => {
    expect(countryFlag('gb')).toBe('🇬🇧');
  });

  it('is case-insensitive', () => {
    expect(countryFlag('US')).toBe('🇺🇸');
  });

  it('returns empty string for malformed input', () => {
    expect(countryFlag('')).toBe('');
    expect(countryFlag('x')).toBe('');
    expect(countryFlag('xyz')).toBe('');
    expect(countryFlag('1a')).toBe('');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test:unit -- src/shared/utils/__tests__/countryFlag.test.ts
```

Expected: FAIL — `Cannot find module '../countryFlag'`.

- [ ] **Step 3: Implement the util**

```ts
// src/shared/utils/countryFlag.ts
const REGIONAL_INDICATOR_A = 0x1f1e6;

export function countryFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '';
  const upper = code.toUpperCase();
  const first = REGIONAL_INDICATOR_A + (upper.charCodeAt(0) - 65);
  const second = REGIONAL_INDICATOR_A + (upper.charCodeAt(1) - 65);
  return String.fromCodePoint(first, second);
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test:unit -- src/shared/utils/__tests__/countryFlag.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/countryFlag.ts src/shared/utils/__tests__/countryFlag.test.ts
git commit -m "feat: country flag emoji util"
```

---

### Task 3: Default country from device locale

**Files:**

- Create: `src/shared/utils/getDefaultCountry.ts`
- Test: `src/shared/utils/__tests__/getDefaultCountry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/shared/utils/__tests__/getDefaultCountry.test.ts
import { getDefaultCountry } from '../getDefaultCountry';

const mockGetLocales = jest.fn();

jest.mock('expo-localization', () => ({
  getLocales: () => mockGetLocales(),
}));

describe('getDefaultCountry', () => {
  beforeEach(() => {
    mockGetLocales.mockReset();
  });

  it('returns the lowercase region code from the first locale', () => {
    mockGetLocales.mockReturnValue([{ regionCode: 'GB' }]);
    expect(getDefaultCountry()).toBe('gb');
  });

  it('falls back to "fi" when getLocales returns an empty array', () => {
    mockGetLocales.mockReturnValue([]);
    expect(getDefaultCountry()).toBe('fi');
  });

  it('falls back to "fi" when regionCode is missing', () => {
    mockGetLocales.mockReturnValue([{ regionCode: null }]);
    expect(getDefaultCountry()).toBe('fi');
  });

  it('falls back to "fi" when regionCode is not a 2-letter code', () => {
    mockGetLocales.mockReturnValue([{ regionCode: 'XYZ' }]);
    expect(getDefaultCountry()).toBe('fi');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test:unit -- src/shared/utils/__tests__/getDefaultCountry.test.ts
```

Expected: FAIL — `Cannot find module '../getDefaultCountry'`.

- [ ] **Step 3: Implement the util**

```ts
// src/shared/utils/getDefaultCountry.ts
import { getLocales } from 'expo-localization';

const FALLBACK = 'fi';

export function getDefaultCountry(): string {
  const region = getLocales()[0]?.regionCode;
  if (typeof region !== 'string' || !/^[A-Za-z]{2}$/.test(region)) {
    return FALLBACK;
  }
  return region.toLowerCase();
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test:unit -- src/shared/utils/__tests__/getDefaultCountry.test.ts
```

Expected: PASS — all four cases.

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/getDefaultCountry.ts src/shared/utils/__tests__/getDefaultCountry.test.ts
git commit -m "feat: getDefaultCountry util from device locale"
```

---

### Task 4: i18n keys

**Files:**

- Modify: `src/i18n/en/locations.json`

- [ ] **Step 1: Add new keys**

Open `src/i18n/en/locations.json`. Inside the existing `"form": { … }` object, add three new keys (keep alphabetical sibling ordering; new keys go alongside the existing `form.*` entries):

```json
"countryLabel": "Country",
"countryPlaceholder": "Select country",
"countrySearchPlaceholder": "Search countries"
```

Resulting `form` block (after edits) should contain the existing keys plus these three.

- [ ] **Step 2: Validate i18n**

```bash
npm run validate:i18n
```

Expected: PASS — no missing/unused keys (the keys will be flagged as unused only after Task 6 wires them up; if the script flags them as unused now, that's expected and acceptable until then — re-run after Task 6).

- [ ] **Step 3: Commit**

```bash
git add src/i18n/en/locations.json
git commit -m "feat: i18n keys for country picker"
```

---

### Task 5: `CountryPicker` shared component

**Files:**

- Create: `src/shared/components/CountryPicker/CountryPicker.tsx`
- Create: `src/shared/components/CountryPicker/index.ts`
- Test: `src/shared/components/CountryPicker/__tests__/CountryPicker.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/shared/components/CountryPicker/__tests__/CountryPicker.test.tsx
import { renderWithProviders } from '@/test/utils';
import { fireEvent } from '@testing-library/react-native';
import { CountryPicker } from '../CountryPicker';

describe('CountryPicker', () => {
  const onChange = jest.fn();

  beforeEach(() => {
    onChange.mockReset();
  });

  it('renders the selected country name', () => {
    const { getByText } = renderWithProviders(
      <CountryPicker value="fi" onChange={onChange} label="Country" />,
    );
    expect(getByText('Finland')).toBeTruthy();
  });

  it('opens the modal when the trigger is pressed', () => {
    const { getByText, queryByPlaceholderText } = renderWithProviders(
      <CountryPicker value="fi" onChange={onChange} label="Country" />,
    );
    expect(queryByPlaceholderText('Search countries')).toBeNull();
    fireEvent.press(getByText('Finland'));
    expect(queryByPlaceholderText('Search countries')).toBeTruthy();
  });

  it('filters the list by name search', () => {
    const { getByText, getByPlaceholderText, queryByText } = renderWithProviders(
      <CountryPicker value="fi" onChange={onChange} label="Country" />,
    );
    fireEvent.press(getByText('Finland'));
    fireEvent.changeText(getByPlaceholderText('Search countries'), 'united king');
    expect(queryByText('United Kingdom')).toBeTruthy();
    expect(queryByText('Finland')).toBeNull();
  });

  it('filters the list by alpha-2 code prefix', () => {
    const { getByText, getByPlaceholderText, queryByText } = renderWithProviders(
      <CountryPicker value="fi" onChange={onChange} label="Country" />,
    );
    fireEvent.press(getByText('Finland'));
    fireEvent.changeText(getByPlaceholderText('Search countries'), 'gb');
    expect(queryByText('United Kingdom')).toBeTruthy();
  });

  it('calls onChange with the selected alpha-2 code and closes the modal', () => {
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = renderWithProviders(
      <CountryPicker value="fi" onChange={onChange} label="Country" />,
    );
    fireEvent.press(getByText('Finland'));
    fireEvent.changeText(getByPlaceholderText('Search countries'), 'united king');
    fireEvent.press(getByText('United Kingdom'));
    expect(onChange).toHaveBeenCalledWith('gb');
    expect(queryByPlaceholderText('Search countries')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run test:unit -- src/shared/components/CountryPicker
```

Expected: FAIL — `Cannot find module '../CountryPicker'`.

- [ ] **Step 3: Implement the component**

Create `src/shared/components/CountryPicker/CountryPicker.tsx`:

```tsx
import { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { COUNTRIES } from '@/shared/data/countries';
import { countryFlag } from '@/shared/utils/countryFlag';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';

export interface CountryPickerProps {
  readonly value: string;
  readonly onChange: (code: string) => void;
  readonly label: string;
  readonly error?: boolean;
}

export function CountryPicker({ value, onChange, label, error }: CountryPickerProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('locations');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        triggerInput: {
          backgroundColor: theme.customColors.surfaceContainerHighest,
          borderRadius: borderRadius.md,
        },
        modal: {
          backgroundColor: theme.colors.surface,
          margin: spacing.lg,
          borderRadius: borderRadius.md,
          padding: spacing.base,
          maxHeight: '80%',
        },
        searchInput: {
          backgroundColor: theme.customColors.surfaceContainerHighest,
          borderRadius: borderRadius.md,
          marginBottom: spacing.sm,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.xs,
          gap: spacing.sm,
        },
        rowName: { flex: 1, color: theme.colors.onSurface },
        rowCode: { color: theme.colors.onSurfaceVariant },
      }),
    [theme],
  );

  const underlineColor = colorWithAlpha(theme.colors.outlineVariant, 0.15);
  const activeUnderlineColor = theme.colors.primary;

  const selected = COUNTRIES.find((c) => c.code === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.startsWith(q));
  }, [query]);

  const handleSelect = useCallback(
    (code: string) => {
      onChange(code);
      setOpen(false);
      setQuery('');
    },
    [onChange],
  );

  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button">
        <TextInput
          mode="flat"
          label={label}
          value={selected ? `${countryFlag(selected.code)}  ${selected.name}` : ''}
          editable={false}
          pointerEvents="none"
          error={error}
          style={styles.triggerInput}
          underlineColor={underlineColor}
          activeUnderlineColor={activeUnderlineColor}
        />
      </Pressable>

      <Portal>
        <Modal visible={open} onDismiss={() => setOpen(false)} contentContainerStyle={styles.modal}>
          <TextInput
            mode="flat"
            placeholder={t('form.countrySearchPlaceholder')}
            value={query}
            onChangeText={setQuery}
            autoFocus
            style={styles.searchInput}
            underlineColor={underlineColor}
            activeUnderlineColor={activeUnderlineColor}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable onPress={() => handleSelect(item.code)} accessibilityRole="button">
                <View style={styles.row}>
                  <Text variant="bodyLarge">{countryFlag(item.code)}</Text>
                  <Text variant="bodyMedium" style={styles.rowName}>
                    {item.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.rowCode}>
                    {item.code.toUpperCase()}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </Modal>
      </Portal>
    </>
  );
}
```

Create `src/shared/components/CountryPicker/index.ts`:

```ts
export { CountryPicker, type CountryPickerProps } from './CountryPicker';
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test:unit -- src/shared/components/CountryPicker
```

Expected: PASS — all five cases. If the modal's `Portal` doesn't render in tests, ensure `renderWithProviders` wraps with a `PaperProvider` that includes `Portal.Host` (it should already — check `src/test/utils.tsx`). If not, file an issue and adapt the test to query the modal differently.

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/CountryPicker
git commit -m "feat: CountryPicker shared component"
```

---

### Task 6: Wire the picker into `LocationForm`

**Files:**

- Modify: `src/features/locations/components/LocationForm/LocationForm.tsx`
- Modify: `src/features/locations/components/LocationForm/__tests__/LocationForm.test.tsx`

- [ ] **Step 1: Add failing tests for the new behavior**

Append the following cases to `LocationForm.test.tsx`. The existing file already mocks `geocodePostcode` via `mockGeocodePostcode`. Also mock `getDefaultCountry` so the test is deterministic.

Add at the top of the file (after the existing `jest.mock(...)` for geocoding):

```ts
jest.mock('@/shared/utils/getDefaultCountry', () => ({
  getDefaultCountry: () => 'fi',
}));
```

Add inside the `describe('LocationForm', …)` block:

```tsx
it('defaults the country from getDefaultCountry', () => {
  const { getByText } = renderWithProviders(<LocationForm {...defaultProps} />);
  // 'Finland' is the name for 'fi'
  expect(getByText('Finland')).toBeTruthy();
});

it('passes country to geocodePostcode on postcode blur', async () => {
  mockGeocodePostcode.mockResolvedValue({ areaName: 'Helsinki', lat: 60.17, lng: 24.94 });
  const { getByPlaceholderText } = renderWithProviders(<LocationForm {...defaultProps} />);
  const input = getByPlaceholderText('Enter your postcode');
  fireEvent.changeText(input, '00100');
  fireEvent(input, 'blur');
  await waitFor(() => {
    expect(mockGeocodePostcode).toHaveBeenCalledWith('00100', 'fi');
  });
});

it('clears the area preview and re-geocodes when the country changes', async () => {
  mockGeocodePostcode.mockResolvedValueOnce({ areaName: 'Helsinki', lat: 60.17, lng: 24.94 });
  const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
    <LocationForm {...defaultProps} />,
  );

  const postcode = getByPlaceholderText('Enter your postcode');
  fireEvent.changeText(postcode, '00100');
  fireEvent(postcode, 'blur');
  await waitFor(() => expect(queryByText(/Area:/)).toBeTruthy());

  // Open country picker and switch to United Kingdom
  mockGeocodePostcode.mockResolvedValueOnce({ areaName: 'London', lat: 51.5, lng: -0.1 });
  fireEvent.press(getByText('Finland'));
  fireEvent.changeText(getByPlaceholderText('Search countries'), 'united king');
  fireEvent.press(getByText('United Kingdom'));

  await waitFor(() => {
    expect(mockGeocodePostcode).toHaveBeenLastCalledWith('00100', 'gb');
  });
});
```

- [ ] **Step 2: Run tests to verify the three new cases fail**

```bash
npm run test:unit -- src/features/locations/components/LocationForm
```

Expected: existing cases still PASS; the three new cases FAIL (country field absent, `geocodePostcode` called with one arg, etc.).

- [ ] **Step 3: Modify `LocationForm.tsx`**

Apply the following changes in `src/features/locations/components/LocationForm/LocationForm.tsx`:

1. Add imports near the existing imports:

   ```ts
   import { CountryPicker } from '@/shared/components/CountryPicker';
   import { getDefaultCountry } from '@/shared/utils/getDefaultCountry';
   ```

2. Add country state alongside the existing `useState` calls (after the `postcode` state):

   ```ts
   const [country, setCountry] = useState<string>(getDefaultCountry());
   ```

3. Update `handleGeocodePostcode` to read `country` and pass it through. Also extract the call signature so the country-change handler can reuse it. The simplest correct change is:

   ```ts
   const handleGeocodePostcode = useCallback(async () => {
     if (!postcode.trim()) return;
     setIsGeocoding(true);
     setGeocoded(undefined);
     setErrors((prev) => ({ ...prev, geocode: undefined }));
     try {
       const result = await geocodePostcode(postcode, country);
       setGeocoded(result);
     } catch {
       setErrors((prev) => ({ ...prev, geocode: t('errors.geocodeFailed') }));
     } finally {
       setIsGeocoding(false);
     }
   }, [postcode, country, t]);
   ```

4. Add a country-change handler that clears `geocoded` and auto re-runs geocoding when a postcode is already present:

   ```ts
   const handleCountryChange = useCallback(
     (next: string) => {
       setCountry(next);
       setGeocoded(undefined);
       setErrors((prev) => ({ ...prev, geocode: undefined }));
       if (postcode.trim()) {
         // Defer one tick so country state is reflected in the next geocode call
         void handleGeocodePostcode();
       }
     },
     [postcode, handleGeocodePostcode],
   );
   ```

   Note: `handleGeocodePostcode` reads `country` from its closure. Because we call `setCountry(next)` first, the next render produces a new `handleGeocodePostcode` with the updated `country`. But the call inside `handleCountryChange` still references the _current_ closure. To avoid that staleness, change `handleGeocodePostcode` to accept an optional override and pass `next` through:

   ```ts
   const handleGeocodePostcode = useCallback(
     async (countryOverride?: string) => {
       if (!postcode.trim()) return;
       const effectiveCountry = countryOverride ?? country;
       setIsGeocoding(true);
       setGeocoded(undefined);
       setErrors((prev) => ({ ...prev, geocode: undefined }));
       try {
         const result = await geocodePostcode(postcode, effectiveCountry);
         setGeocoded(result);
       } catch {
         setErrors((prev) => ({ ...prev, geocode: t('errors.geocodeFailed') }));
       } finally {
         setIsGeocoding(false);
       }
     },
     [postcode, country, t],
   );
   ```

   Then `handleCountryChange` becomes:

   ```ts
   const handleCountryChange = useCallback(
     (next: string) => {
       setCountry(next);
       setGeocoded(undefined);
       setErrors((prev) => ({ ...prev, geocode: undefined }));
       if (postcode.trim()) void handleGeocodePostcode(next);
     },
     [postcode, handleGeocodePostcode],
   );
   ```

   The `TextInput`'s `onBlur` keeps calling `handleGeocodePostcode()` (no arg).

5. Render the `CountryPicker` above the postcode block. Insert after the existing `<View style={styles.container}>` opener and before the existing postcode `<Text variant="labelLarge" …>`:

   ```tsx
   <CountryPicker value={country} onChange={handleCountryChange} label={t('form.countryLabel')} />
   ```

6. The `LocationFormData` interface stays unchanged. The country is not part of `onSave`'s payload.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:unit -- src/features/locations/components/LocationForm
```

Expected: PASS — all existing cases plus the three new ones.

- [ ] **Step 5: Validate the whole suite**

```bash
npm run validate
```

Expected: PASS — format, lint, type-check, test, build.

- [ ] **Step 6: Commit**

```bash
git add src/features/locations/components/LocationForm/LocationForm.tsx \
        src/features/locations/components/LocationForm/__tests__/LocationForm.test.tsx
git commit -m "feat: country selector in LocationForm

Defaults from device locale via expo-localization. Country is passed to
geocodePostcode for unambiguous Nominatim lookups. Changing the country
with a postcode already present auto re-runs geocoding."
```

---

### Task 7: Manual smoke test

**Files:** none

- [ ] **Step 1: Start the app**

```bash
npm run dev
```

- [ ] **Step 2: Smoke test in a browser or simulator**

1. Open the app, navigate to **Locations → Add location**.
2. Verify the country field defaults to your device locale (e.g. "Finland" on a Finnish device).
3. Type a valid postcode for that country (e.g. `00100` for FI) and blur — area preview should appear within ~1s.
4. Tap the country field; the modal should open with a searchable list.
5. Type `united king`; the list should filter to "United Kingdom".
6. Select **United Kingdom**; modal closes and the area preview refreshes — postcode `00100` likely returns "not found" in GB, which is the expected failure mode (the error message "Could not find that postcode" should appear).
7. Change the postcode to `SW1A 1AA` and blur — area preview should update to a London area.
8. Save the location and confirm it appears in the list with the correct area name.

- [ ] **Step 3: Note any defects**

If the picker UI feels off (modal sizing, search behavior, flag rendering on Android), file follow-ups — do not block this PR for polish.

- [ ] **Step 4: Push and open PR**

From the worktree (`.worktrees/location-country-picker/`):

```bash
git push -u origin feat/location-country-picker
gh pr create --title "feat: country selector in location add/edit form" \
  --body "$(cat <<'EOF'
## Summary
- Adds a `CountryPicker` shared component (full ISO 3166-1 list, search, flag emoji).
- `LocationForm` now passes the selected country to `geocodePostcode` so Nominatim lookups are unambiguous.
- Default country comes from `expo-localization`; falls back to `fi` if the device region is missing.
- Country is request-only — no schema change, not persisted on `saved_locations`.

Fixes the "postcode search doesn't work" bug for users outside well-disambiguated regions.

## Test plan
- [ ] `npm run validate` passes locally
- [ ] Manual smoke test: add a location in the device-locale country
- [ ] Manual smoke test: switch country and confirm area preview re-fetches
- [ ] Manual smoke test: invalid postcode in the selected country shows the geocode error
EOF
)"
```

---

## Out of scope reminders (do not implement here)

- DB migration for `saved_locations.country` — deferred.
- Localized country names — deferred.
- "Did you mean…" disambiguation across multiple countries.
- Replacing postcode with a free-text place search.
