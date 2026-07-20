import { createContext, useContext } from "react";
import type { KeyboardContextValue } from "./types";


export const keyboardContext = createContext<KeyboardContextValue | null>(null);

export const useKeyboardLayer = () => {
  const value = useContext(keyboardContext);
  if (!value) {
    throw new Error("useKeyboardLayer must be used inside keyboardProvider");
  }

  return value;
};
