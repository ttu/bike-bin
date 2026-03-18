import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import commonEn from '@/i18n/en/common.json';
import authEn from '@/i18n/en/auth.json';
import onboardingEn from '@/i18n/en/onboarding.json';
import inventoryEn from '@/i18n/en/inventory.json';
import locationsEn from '@/i18n/en/locations.json';
import searchEn from '@/i18n/en/search.json';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

i18n.use(initReactI18next).init({
  lng: deviceLanguage,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'auth', 'onboarding', 'inventory', 'locations', 'search'],
  resources: {
    en: {
      common: commonEn,
      auth: authEn,
      onboarding: onboardingEn,
      inventory: inventoryEn,
      locations: locationsEn,
      search: searchEn,
    },
  },
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;
