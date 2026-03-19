import { createContext } from 'react';

export interface DemoModeContextType {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

export const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);
