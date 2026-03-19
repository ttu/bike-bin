import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="locations" />
      <Stack.Screen name="borrow-requests" />
      <Stack.Screen name="groups/index" />
      <Stack.Screen name="groups/[id]" />
      <Stack.Screen name="[userId]" />
      <Stack.Screen name="notification-settings" />
    </Stack>
  );
}
