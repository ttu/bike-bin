import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import commonEn from '@/i18n/en/common.json';
import authEn from '@/i18n/en/auth.json';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

i18n.use(initReactI18next).init({
  lng: deviceLanguage,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'auth'],
  resources: {
    en: {
      common: commonEn,
      auth: authEn,
    },
  },
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;
