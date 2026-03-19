import { useContext, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthContext } from '../context';
import type { AuthContextType } from '../context';
import { DemoModeContext } from '@/features/demo/context';

const DEMO_USER: User = {
  id: 'demo-user-001',
  aud: 'demo',
  created_at: '',
  role: '',
  email: '',
  app_metadata: {},
  user_metadata: {},
} as User;

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const demoContext = useContext(DemoModeContext);
  const isDemoMode = demoContext?.isDemoMode ?? false;

  return useMemo(() => {
    if (!isDemoMode) return context;
    return {
      ...context,
      user: DEMO_USER,
      isAuthenticated: true,
      isLoading: false,
    };
  }, [isDemoMode, context]);
}
