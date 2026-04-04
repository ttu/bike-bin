/**
 * Selects a tab and shows its stack root (`index`). Used by the custom tab bar so
 * deep routes (e.g. opening search/[id] from messages) do not block the tab home
 * when the user taps that tab again.
 */
export function navigateToTabRoot(
  navigation: {
    navigate: (name: string, params: { screen: string; params: Record<string, never> }) => void;
  },
  routeName: string,
): void {
  navigation.navigate(routeName, {
    screen: 'index',
    params: {},
  });
}
