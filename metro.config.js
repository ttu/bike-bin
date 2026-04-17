const path = require('path');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withStorybook } = require('@storybook/react-native/metro/withStorybook');

const config = getSentryExpoConfig(__dirname);

module.exports = withStorybook(config, {
  enabled: process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true',
  configPath: path.resolve(__dirname, './.rnstorybook'),
});
