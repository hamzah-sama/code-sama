import { createContext, useContext } from "react";
import type { ToastContextValue } from "./type";

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return value;
};
