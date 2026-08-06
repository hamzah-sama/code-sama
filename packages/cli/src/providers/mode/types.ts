import type { ModeType } from "@code-sama/shared";

export type ModeContextValue = {
  mode: ModeType;
  toggleMode: () => void;
  setMode: (mode: ModeType) => void;
};
