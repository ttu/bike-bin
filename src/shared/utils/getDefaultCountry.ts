import { getLocales } from 'expo-localization';

const FALLBACK = 'fi';

export function getDefaultCountry(): string {
  const region = getLocales()[0]?.regionCode;
  if (typeof region !== 'string' || !/^[A-Za-z]{2}$/.test(region)) {
    return FALLBACK;
  }
  return region.toLowerCase();
}
