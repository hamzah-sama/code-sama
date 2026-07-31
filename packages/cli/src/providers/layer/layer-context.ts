import { createContext, useContext } from "react";
import type { LayerContextValue } from "./types";


export const layerContext = createContext<LayerContextValue | null>(null);

export const useLayer = () => {
  const value = useContext(layerContext);
  if (!value) {
    throw new Error("useLayer must be used inside layerProvider");
  }

  return value;
};
