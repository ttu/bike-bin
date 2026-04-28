import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme-preference';

interface ThemePreferenceContextType {
  preference: ThemePreference;
  effectiveTheme: EffectiveTheme;
  setPreference: (pref: ThemePreference) => void;
}

const ThemePreferenceContext = createContext<ThemePreferenceContextType | undefined>(undefined);

/**
 * Provides user-overridable theme preference backed by AsyncStorage.
 * Wraps PaperProvider so the effective theme can be passed down.
 */
export function ThemePreferenceProvider({ children }: { readonly children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  /** Once the user sets a preference, ignore late AsyncStorage hydration (avoids stomping the choice). */
  const skipHydrationRef = useRef(false);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (skipHydrationRef.current) {
        return;
      }
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreference(stored);
      }
    });
  }, []);

  const setPreferenceAndPersist = useCallback((pref: ThemePreference) => {
    skipHydrationRef.current = true;
    setPreference(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {
      // Best-effort persistence; the in-memory preference is the source of truth.
    });
  }, []);

  let effectiveTheme: EffectiveTheme;
  if (preference === 'system') {
    effectiveTheme = systemScheme === 'dark' ? 'dark' : 'light';
  } else {
    effectiveTheme = preference;
  }

  const value = useMemo(
    () => ({ preference, effectiveTheme, setPreference: setPreferenceAndPersist }),
    [preference, effectiveTheme, setPreferenceAndPersist],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  );
}

/**
 * Hook to read and set the user's theme preference.
 * Returns the stored preference (system/light/dark) and the resolved effective theme.
 */
export function useThemePreference(): ThemePreferenceContextType {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error('useThemePreference must be used within a ThemePreferenceProvider');
  }
  return context;
}
