import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext, darkTheme, lightTheme, themes, type ThemePreference, type ThemeValue } from './theme';

const STORAGE_KEY = 'aitrainer.themePreference';
const isPreference = (value: unknown): value is ThemePreference => value === 'system' || value === 'light' || value === 'dark';

/** Resolves the person's saved Appearance choice (or the phone's setting) to a palette for useTheme(). */
export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => { if (isPreference(saved)) setPreferenceState(saved); })
      .catch(() => {}) // Unreadable storage just means following the system setting.
      .finally(() => setLoaded(true));
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
    return {
      scheme,
      colors: themes[scheme === 'dark' ? darkTheme : lightTheme],
      preference,
      setPreference: next => {
        setPreferenceState(next);
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      },
    };
  }, [preference, system]);

  // Wait for the saved choice so the app doesn't flash the wrong theme on launch.
  if (!loaded) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
