import { Stack } from 'expo-router';

export default function InventoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="edit/[id]" />
      <Stack.Screen name="bikes/index" />
      <Stack.Screen name="bikes/new" />
      <Stack.Screen name="bikes/[id]" />
      <Stack.Screen name="bikes/edit/[id]" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
