import React, { useCallback, useContext, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
// Deep-import the context module rather than going through '@/features/auth'.
// The auth slice's index.ts also re-exports AuthContext, but importing through
// it pulls in AuthProvider -> the real supabase client, which crashes the ~70
// test files that mock '@/features/auth' without also mocking supabaseUrl.
// The context module is a pure boundary (createContext + type) and is safe to
// share across features.
import { AuthContext, type AuthContextType } from '@/features/auth/context';
import { DemoModeContext } from './context';
import { seedDemoData, clearDemoData } from './hooks/useDemoQuerySeeder';

const DEMO_USER: User = {
  id: 'demo-user-001',
  aud: 'demo',
  created_at: '',
  role: '',
  email: '',
  app_metadata: {},
  user_metadata: {},
} as User;

export function DemoModeProvider({ children }: { readonly children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const queryClient = useQueryClient();
  const authContext = useContext(AuthContext);

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

  const overlayedAuth = useMemo<AuthContextType | undefined>(() => {
    if (!isDemoMode || !authContext) return authContext;
    return {
      ...authContext,
      user: DEMO_USER,
      isAuthenticated: true,
      isLoading: false,
    };
  }, [isDemoMode, authContext]);

  const wrappedChildren = overlayedAuth ? (
    <AuthContext.Provider value={overlayedAuth}>{children}</AuthContext.Provider>
  ) : (
    children
  );

  return <DemoModeContext.Provider value={value}>{wrappedChildren}</DemoModeContext.Provider>;
}
