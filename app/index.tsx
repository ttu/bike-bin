import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth';
import { useDemoMode } from '@/features/demo';
import { LoadingScreen } from '@/shared/components/LoadingScreen';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDemoMode } = useDemoMode();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isDemoMode) {
    return <Redirect href="/(tabs)/inventory" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // TODO: Add onboarding check in Task 3.4
  return <Redirect href="/(tabs)/inventory" />;
}
