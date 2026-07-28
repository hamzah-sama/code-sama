import { createContext, useContext } from "react";
import type { ModeContextValue } from "./types";

export const modeContext = createContext<ModeContextValue | null>(null);

export const useMode = () => {
  const value = useContext(modeContext);
  if (!value) {
    throw new Error("useMode must be used inside ModeProvider");
  }

  return value;
};
