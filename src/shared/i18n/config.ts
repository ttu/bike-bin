import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import commonEn from '@/i18n/en/common.json';
import authEn from '@/i18n/en/auth.json';
import onboardingEn from '@/i18n/en/onboarding.json';
import inventoryEn from '@/i18n/en/inventory.json';
import locationsEn from '@/i18n/en/locations.json';
import searchEn from '@/i18n/en/search.json';
import messagesEn from '@/i18n/en/messages.json';
import borrowEn from '@/i18n/en/borrow.json';
import exchangeEn from '@/i18n/en/exchange.json';
import bikesEn from '@/i18n/en/bikes.json';
import groupsEn from '@/i18n/en/groups.json';
import ratingsEn from '@/i18n/en/ratings.json';
import notificationsEn from '@/i18n/en/notifications.json';
import profileEn from '@/i18n/en/profile.json';
import demoEn from '@/i18n/en/demo.json';
import storybookEn from '@/i18n/en/storybook.json';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

i18n.use(initReactI18next).init({
  lng: deviceLanguage,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: [
    'common',
    'auth',
    'onboarding',
    'inventory',
    'locations',
    'search',
    'messages',
    'borrow',
    'exchange',
    'bikes',
    'groups',
    'ratings',
    'notifications',
    'profile',
    'demo',
    'storybook',
  ],
  resources: {
    en: {
      common: commonEn,
      auth: authEn,
      onboarding: onboardingEn,
      inventory: inventoryEn,
      locations: locationsEn,
      search: searchEn,
      messages: messagesEn,
      borrow: borrowEn,
      exchange: exchangeEn,
      bikes: bikesEn,
      groups: groupsEn,
      ratings: ratingsEn,
      notifications: notificationsEn,
      profile: profileEn,
      demo: demoEn,
      storybook: storybookEn,
    },
  },
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;
