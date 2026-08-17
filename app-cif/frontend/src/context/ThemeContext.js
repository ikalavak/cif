import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";
import { LIGHT, DARK } from "../theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Fallback to light if the operating system scheme cannot be read
  const colorScheme = Appearance.getColorScheme() || "light";

  // CHANGED: Shifted default app boot state to 'light' instead of 'dark'
  const [mode, setMode] = useState("light"); // 'light' | 'dark' | 'system'
  const [systemScheme, setSystemScheme] = useState(colorScheme);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme: cs }) => {
      // Fallback to light on device changes
      setSystemScheme(cs || "light");
    });
    return () => sub.remove();
  }, []);

  const scheme = useMemo(() => {
    if (mode === "system") return systemScheme;
    return mode;
  }, [mode, systemScheme]);

  const colors = useMemo(() => (scheme === "dark" ? DARK : LIGHT), [scheme]);

  // Provide backwards-compatible aliases used across the app
  const colorsWithAliases = useMemo(
    () => ({
      ...colors,
      // Some components expect `background` instead of `bg`
      background: colors.bg,
      // Keep legacy key for direct imports
      bg: colors.bg,
    }),
    [colors],
  );

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const value = {
    mode,
    setMode,
    scheme,
    colors: colorsWithAliases,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export default ThemeContext;
