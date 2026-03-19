import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="locations" />
      <Stack.Screen name="borrow-requests" />
    </Stack>
  );
}
