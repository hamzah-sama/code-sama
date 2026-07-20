import { useCallback, useState, type ReactNode } from "react";
import { ThemeContext } from "./theme-context";
import type { Theme } from "./theme-list";
import { getIntialTheme, savedPreferenceTheme } from "./theme-dir";

interface Props {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: Props) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(getIntialTheme);

  const setTheme = useCallback((theme: Theme) => {
    setCurrentTheme(theme);
    savedPreferenceTheme(theme);
  }, []);
  return (
    <ThemeContext.Provider
      value={{ currentTheme, setTheme, colors: currentTheme.colors }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
