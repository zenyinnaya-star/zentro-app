import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

export type ThemeColors = {
  background: string;
  card: string;
  border: string;
  accent: string;
  accentSoft: string;
  textPrimary: string;
  textMuted: string;
};

export const LIGHT: ThemeColors = {
  background: '#FFFFFF',
  card: '#FAFAFC',
  border: '#F0EEF1',
  accent: '#FF383C',
  accentSoft: '#FFF2F7',
  textPrimary: '#25131A',
  textMuted: '#928A8D',
};

export const DARK: ThemeColors = {
  background: '#17101A',
  card: '#231A25',
  border: '#332830',
  accent: '#FF383C',
  accentSoft: '#3A1A22',
  textPrimary: '#F5EFF2',
  textMuted: '#A79AA0',
};

type ThemeContextValue = {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark,
      colors: isDark ? DARK : LIGHT,
      toggleTheme: () => setIsDark((prev) => !prev),
    }),
    [isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
