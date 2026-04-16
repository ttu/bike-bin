import type { Preview } from '@storybook/react-native';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StoryProviders } from '@/storybook/StoryProviders';

const styles = StyleSheet.create({
  root: { flex: 1 },
  canvas: {
    flex: 1,
    padding: 16,
    alignSelf: 'stretch',
  },
});

const preview: Preview = {
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <StoryProviders>
            <View style={styles.canvas}>
              <Story />
            </View>
          </StoryProviders>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
