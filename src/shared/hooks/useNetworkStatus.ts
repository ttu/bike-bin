import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Hook to monitor network connectivity status.
 * Uses @react-native-community/netinfo under the hood.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline };
}
