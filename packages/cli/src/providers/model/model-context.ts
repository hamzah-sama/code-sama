import { createContext, useContext } from "react";
import type { ModelContextValue } from "./types";

export const modelContext = createContext<ModelContextValue | null>(null);

export const useModel = () => {
  const value = useContext(modelContext);
  if (!value) {
    throw new Error("useModel must be used inside ModelProvider");
  }

  return value;
};
