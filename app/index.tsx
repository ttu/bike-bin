import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth';
import { LoadingScreen } from '@/shared/components/LoadingScreen';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // TODO: Add onboarding check in Task 3.4
  return <Redirect href="/(tabs)/inventory" />;
}
