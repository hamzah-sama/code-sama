import { createContext, useContext } from "react";
import type { DialogContextValue } from "./type";

export const DialogContext = createContext<DialogContextValue | null>(null);

export const useDialog = () => {
  const value = useContext(DialogContext);
  if (!value) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return value;
};
