import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetworkStatus } from './useNetworkStatus';

const QUEUE_STORAGE_KEY = 'offline-mutation-queue';

interface QueuedMutation {
  id: string;
  timestamp: number;
  mutationKey: string;
  variables: unknown;
}

/**
 * Hook for queuing mutations when offline and replaying them on reconnect.
 * Stores pending mutations in AsyncStorage so they survive app restarts.
 */
export function useOfflineQueue() {
  const { isOnline } = useNetworkStatus();
  const [queue, setQueue] = useState<QueuedMutation[]>([]);
  const replayHandlersRef = useRef<Map<string, (variables: unknown) => Promise<void>>>(new Map());
  const isReplayingRef = useRef(false);

  // Load queue from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(QUEUE_STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          setQueue(JSON.parse(stored));
        } catch {
          // Corrupted data, reset
          AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
        }
      }
    });
  }, []);

  // Persist queue to storage whenever it changes
  useEffect(() => {
    AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Replay queue when coming back online
  useEffect(() => {
    if (!isOnline || queue.length === 0 || isReplayingRef.current) return;

    const replay = async () => {
      isReplayingRef.current = true;
      const remaining: QueuedMutation[] = [];

      for (const mutation of queue) {
        const handler = replayHandlersRef.current.get(mutation.mutationKey);
        if (handler) {
          try {
            await handler(mutation.variables);
          } catch {
            // Failed to replay, keep in queue
            remaining.push(mutation);
          }
        } else {
          // No handler registered, keep in queue
          remaining.push(mutation);
        }
      }

      isReplayingRef.current = false;
      setQueue(remaining);
    };

    replay();
  }, [isOnline, queue]);

  const enqueue = useCallback((mutationKey: string, variables: unknown) => {
    const item: QueuedMutation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      mutationKey,
      variables,
    };
    setQueue((prev) => [...prev, item]);
  }, []);

  const registerHandler = useCallback(
    (mutationKey: string, handler: (variables: unknown) => Promise<void>) => {
      replayHandlersRef.current.set(mutationKey, handler);
    },
    [],
  );

  return {
    queue,
    pendingCount: queue.length,
    enqueue,
    registerHandler,
    isOnline,
  };
}
