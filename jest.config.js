module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/e2e/',
    '<rootDir>/.worktrees/',
    // RLS tests need local Supabase; run with `npm run test:rls` (jest.rls.config.js).
    '<rootDir>/src/test/__tests__/rls/',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-paper|react-native-vector-icons|@faker-js/faker|react-native-gesture-handler|react-native-reanimated|@gorhom/bottom-sheet)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/index.ts',
    '!src/test/**',
    // Generated / type-only — no meaningful runtime coverage
    '!src/shared/types/database.ts',
    '!src/shared/types/models.ts',
    '!src/shared/types/rows.ts',
    'app/**/*.{ts,tsx}',
    '!app/**/*.stories.{ts,tsx}',
    '!app/**/*.test.{ts,tsx}',
    '!app/**/index.ts',
  ],
  // Per-tree gates: `src/` holds feature code (strict). `app/` is Expo Router screens (thin but many branches);
  // a single global % mixes them and fails despite strong `src/` coverage.
  coverageThreshold: {
    'src/': {
      branches: 65,
      functions: 65,
      lines: 65,
      statements: 65,
    },
    'app/': {
      branches: 28,
      functions: 21,
      lines: 33,
      statements: 33,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
