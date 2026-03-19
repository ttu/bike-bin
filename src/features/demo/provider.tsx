import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DemoModeContext } from './context';
import { seedDemoData, clearDemoData } from './hooks/useDemoQuerySeeder';

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const queryClient = useQueryClient();

  const enterDemoMode = useCallback(() => {
    seedDemoData(queryClient);
    setIsDemoMode(true);
  }, [queryClient]);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    clearDemoData(queryClient);
  }, [queryClient]);

  const value = useMemo(
    () => ({ isDemoMode, enterDemoMode, exitDemoMode }),
    [isDemoMode, enterDemoMode, exitDemoMode],
  );

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}
