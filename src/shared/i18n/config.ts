import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import commonEn from '@/i18n/en/common.json';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

i18n.use(initReactI18next).init({
  lng: deviceLanguage,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common'],
  resources: {
    en: {
      common: commonEn,
    },
  },
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;
