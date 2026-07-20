import { join } from "node:path";
import { homedir } from "node:os";
import { DEFAULT_THEME, THEMES, type Theme } from "./theme-list";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CONFIG_DIR = join(homedir(), ".codesama");
const THEME_PATH = join(CONFIG_DIR, "themes.json");

type ThemePreference = {
  themeName: string;
};

export const getIntialTheme = () => {
  try {
    const preferenceTheme = JSON.parse(
      readFileSync(THEME_PATH, "utf-8"),
    ) as Partial<ThemePreference>;

    const saved_theme = THEMES.find(
      (theme) => theme.name === preferenceTheme.themeName,
    );
    return saved_theme ?? DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

export const savedPreferenceTheme = (theme: Theme) => {
  try {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(
      THEME_PATH,
      JSON.stringify(
        { themeName: theme.name } satisfies ThemePreference,
        null,
        2,
      ),
      "utf8",
    );
  } catch {}
};


