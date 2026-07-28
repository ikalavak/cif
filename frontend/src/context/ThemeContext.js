import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { LIGHT, DARK } from '../theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const colorScheme = Appearance.getColorScheme() || 'light';
  const [mode, setMode] = useState('system'); // 'light' | 'dark' | 'system'
  const [systemScheme, setSystemScheme] = useState(colorScheme);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme: cs }) => {
      setSystemScheme(cs || 'light');
    });
    return () => sub.remove();
  }, []);

  const scheme = useMemo(() => {
    if (mode === 'system') return systemScheme;
    return mode;
  }, [mode, systemScheme]);

  const colors = useMemo(() => (scheme === 'dark' ? DARK : LIGHT), [scheme]);

  const toggleTheme = () => {
    setMode(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const value = {
    mode,
    setMode,
    scheme,
    colors,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default ThemeContext;
