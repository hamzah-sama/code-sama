import type { Mode } from "@code-sama/database";

export type ModeContextValue = {
  mode: Mode;
  toggleMode: () => void;
  setMode: (mode: Mode) => void;
};
