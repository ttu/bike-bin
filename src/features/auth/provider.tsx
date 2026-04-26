import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/shared/api/supabase';
import { AuthContext } from './context';
import { signInWithOAuthProvider } from './utils/signInWithOAuthProvider';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (!isMounted) {
          return;
        }
        setSession(currentSession);
      } catch {
        // Invalid/expired refresh tokens should not crash the app shell.
        if (!isMounted) {
          return;
        }
        setSession(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithOAuthProvider('google');
  }, []);

  const signInWithApple = useCallback(async () => {
    await signInWithOAuthProvider('apple');
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const user: User | null = session?.user ?? null;
  const isAuthenticated = user !== null;

  const value = useMemo(
    () => ({
      session,
      user,
      isAuthenticated,
      isLoading,
      signInWithGoogle,
      signInWithApple,
      signOut,
    }),
    [session, user, isAuthenticated, isLoading, signInWithGoogle, signInWithApple, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
