import { createContext, use } from "react";
import type { Theme, ThemeColors } from "./theme-list";

type ThemeContextValue = {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = (): ThemeContextValue => {
  const value = use(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return value;
};
