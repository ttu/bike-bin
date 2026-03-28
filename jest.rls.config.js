module.exports = {
  testMatch: ['<rootDir>/src/test/__tests__/rls/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.tsx?$': [
      'babel-jest',
      { configFile: './babel.config.js' },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30_000,
};
