import { Stack } from 'expo-router';

export default function BikesTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="edit/[id]" />
    </Stack>
  );
}
