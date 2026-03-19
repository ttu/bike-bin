import { useContext } from 'react';
import { DemoModeContext } from '../context';
import type { DemoModeContextType } from '../context';

export function useDemoMode(): DemoModeContextType {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}
