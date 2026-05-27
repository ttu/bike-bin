# Location Country Picker — Design

**Date:** 2026-05-26
**Branch:** `feat/location-country-picker`
**Status:** Draft

## Problem

`LocationForm` calls `geocodePostcode(postcode)` with no country argument (`src/features/locations/components/LocationForm/LocationForm.tsx:87`). The Edge Function already accepts an optional ISO country code and forwards it to Nominatim as `countrycodes`, but the form never sets it.

Without a country filter, Nominatim's `postalcode` search returns sparse and often wrong results — short numeric codes (`00100`, `10115`, `1010`, etc.) exist in many countries, so the top hit is essentially random. For users outside a handful of well-disambiguated regions, postcode search appears broken.

## Goal

Make postcode geocoding deterministic by requiring a country alongside the postcode. The user picks a country (defaulted from device locale); the form passes that country to the existing `geocodePostcode(postcode, country)` API. The fix lives entirely on the client — no Edge Function or schema changes.

## Non-goals

- Persisting the country on the `saved_locations` row (no DB migration).
- Localizing country names (English only at launch).
- Disambiguation UI ("did you mean…") across multiple candidate countries.
- Free-text place / city autocomplete as a postcode replacement.
- Inferring country from postcode format.

## Design

### Component changes

**`LocationForm.tsx`**

- Add `country` state: `useState<string>(getDefaultCountry())`. Lowercase ISO 3166-1 alpha-2.
- Render a new country field above the postcode field, using the new `CountryPicker` shared component.
- Changing the country clears `geocoded` (mirrors the existing postcode-change behavior so a stale area preview doesn't linger).
- Pass `country` as the second argument to `geocodePostcode(postcode, country)` in `handleGeocodePostcode`.
- `LocationFormData` interface is unchanged. The country is form-internal; it is not part of `onSave`'s payload and is not persisted.

**New `CountryPicker` shared component** — `src/shared/components/CountryPicker/`

- Public API:
  ```ts
  interface CountryPickerProps {
    readonly value: string; // ISO alpha-2, lowercase
    readonly onChange: (code: string) => void;
    readonly label: string;
    readonly error?: boolean;
  }
  ```
- Renders a Paper `TextInput`-styled trigger showing the selected country's flag emoji and English name. Tapping opens a Paper `Modal` (or `Dialog`) with a search `TextInput` and a `FlatList` of all ISO 3166-1 countries.
- Each row: flag emoji + name + alpha-2 code (for users searching by code).
- Search filters by name (case-insensitive `includes`) or alpha-2 prefix.
- Selecting a row calls `onChange` and closes the modal.
- Styled to match other LocationForm inputs (`softInputStyles.softInput`, theme tokens).

**New static data** — `src/shared/data/countries.ts`

- Exports `COUNTRIES: ReadonlyArray<{ code: string; name: string }>` covering ISO 3166-1 alpha-2.
- Owned locally rather than pulling in a runtime dependency. List is static and rarely changes.
- Flag rendering: derive the unicode flag emoji from the alpha-2 code at render time (`String.fromCodePoint(0x1f1e6 + code.charCodeAt(0) - 65, ...)`); no image assets bundled.

**New util** — `src/shared/utils/getDefaultCountry.ts`

- Reads `expo-localization`'s `getLocales()[0]?.regionCode`, lowercases it.
- Falls back to `'fi'` if the region is missing or not a 2-letter ISO code.
- Exported as a pure function so tests can inject a stub.

### i18n

New keys under `locales/en/locations.json` (and the other locale files we already maintain):

- `form.countryLabel` — "Country"
- `form.countryPlaceholder` — "Select country"
- `form.countrySearchPlaceholder` — "Search countries"

Country **names** in the picker stay English-only at launch. Localizing ~250 names is its own initiative and not required to fix the bug.

### Data flow

```
User opens LocationForm
  → country defaults to getDefaultCountry()         (e.g. 'fi' from device locale)
User types postcode and blurs the field
  → handleGeocodePostcode() runs
  → geocodePostcode(postcode, country)              (Edge Function returns areaName, lat, lng)
  → geocoded state populated → area preview renders
User changes country
  → geocoded cleared (stale preview removed)
  → user blurs postcode again to re-trigger geocoding
User taps Save
  → onSave({ postcode, label, isPrimary, geocoded })  (country not in payload)
```

### Error handling

No change to `GeocodeError` semantics. The existing `errors.geocodeFailed` message already covers `NOT_FOUND` and `SERVICE_UNAVAILABLE`. With a country in scope, `NOT_FOUND` becomes the dominant failure mode and is actionable: the user changes the country or the postcode and re-triggers geocoding on blur.

We do not add a separate "no match in selected country" copy — the existing error string suffices for now.

### Tests

- **`LocationForm.test.tsx`** — extend existing suite:
  - country defaults from `getDefaultCountry()` (mocked)
  - changing the country clears the geocoded preview
  - `geocodePostcode` is called with `(postcode, country)`
- **`CountryPicker.test.tsx`** — new:
  - renders the selected country's name
  - opens modal on tap, lists all countries
  - search filters by name and by alpha-2 prefix
  - selecting a row fires `onChange` with the alpha-2 code and closes the modal
- **`getDefaultCountry.test.ts`** — new:
  - returns lowercased region from `expo-localization`
  - falls back to `'fi'` when region is undefined or malformed
- **`countries.test.ts`** — new (lightweight):
  - list is non-empty
  - all codes are 2-letter lowercase
  - codes are unique

E2E is unchanged — existing location flows still work with the default country.

### Files touched

| File | Change |
|---|---|
| `src/features/locations/components/LocationForm/LocationForm.tsx` | Add country state, picker, pass to `geocodePostcode` |
| `src/features/locations/components/LocationForm/__tests__/LocationForm.test.tsx` | Extend tests |
| `src/shared/components/CountryPicker/CountryPicker.tsx` | New |
| `src/shared/components/CountryPicker/__tests__/CountryPicker.test.tsx` | New |
| `src/shared/components/CountryPicker/index.ts` | New |
| `src/shared/data/countries.ts` | New |
| `src/shared/data/__tests__/countries.test.ts` | New |
| `src/shared/utils/getDefaultCountry.ts` | New |
| `src/shared/utils/__tests__/getDefaultCountry.test.ts` | New |
| `src/i18n/locales/*/locations.json` | Three new keys |

### Risks

- **Nominatim postcode coverage varies by country.** Some countries (e.g. IE outside Eircode regions, parts of Africa) have thin OSM postcode data and may still 404 even with the right country. This is a data limitation, not a fix in scope here.
- **Device locale ≠ user's location.** A traveler with a US-locale phone adding a Finnish location will see `us` defaulted and have to switch. Acceptable — the picker is one tap away and we don't persist country to make it stickier.
- **Flag emoji rendering on older Android.** Unicode flag emojis are not glyph-supported on some older Android skins; they degrade to two letters in a box. Acceptable degradation; the country name is always shown alongside.
