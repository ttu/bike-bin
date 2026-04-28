import React from 'react';
import { Button, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ThemePreferenceProvider, useThemePreference } from '../useThemePreference';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

function ThemeReadout() {
  const { preference, setPreference } = useThemePreference();
  return (
    <View>
      <Text testID="preference">{preference}</Text>
      <Button title="set-dark" onPress={() => setPreference('dark')} />
    </View>
  );
}

describe('ThemePreferenceProvider', () => {
  const mockedGetItem = AsyncStorage.getItem as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetItem.mockResolvedValue(null);
  });

  it('does not overwrite user theme choice when AsyncStorage resolves late', async () => {
    let resolveGetItem: (value: string | null) => void = () => {};
    mockedGetItem.mockImplementation(
      () =>
        new Promise<string | null>((resolve) => {
          resolveGetItem = resolve;
        }),
    );

    const { getByTestId, getByText } = render(
      <ThemePreferenceProvider>
        <ThemeReadout />
      </ThemePreferenceProvider>,
    );

    fireEvent.press(getByText('set-dark'));
    expect(getByTestId('preference').props.children).toBe('dark');

    await act(async () => {
      resolveGetItem('light');
    });

    expect(getByTestId('preference').props.children).toBe('dark');
  });

  it('chains AsyncStorage writes when preference changes in quick succession', async () => {
    const persisted: string[] = [];
    const mockedSetItem = AsyncStorage.setItem as jest.Mock;
    mockedSetItem.mockImplementation((_key: string, value: string) => {
      persisted.push(value);
      return Promise.resolve();
    });

    function DualButtons() {
      const { setPreference } = useThemePreference();
      return (
        <View>
          <Button title="go-dark" onPress={() => setPreference('dark')} />
          <Button title="go-light" onPress={() => setPreference('light')} />
        </View>
      );
    }

    const { getByText } = render(
      <ThemePreferenceProvider>
        <DualButtons />
      </ThemePreferenceProvider>,
    );

    fireEvent.press(getByText('go-dark'));
    fireEvent.press(getByText('go-light'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(persisted).toEqual(['dark', 'light']);
  });

  it('applies stored preference when the user has not changed the theme yet', async () => {
    mockedGetItem.mockResolvedValue('dark');

    const { getByTestId } = render(
      <ThemePreferenceProvider>
        <ThemeReadout />
      </ThemePreferenceProvider>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(getByTestId('preference').props.children).toBe('dark');
  });
});
