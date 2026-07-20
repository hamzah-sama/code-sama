import { useRef, useState, type ReactNode } from "react";
import { ToastContext } from "./toast-context";
import { Toast } from "./toast";
import { DEFAULT_TOAST_DURATION, type ToastOptions } from "./type";

interface Props {
  children: ReactNode;
}
export const ToastProvider = ({ children }: Props) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const timeOutHandleRef = useRef<NodeJS.Timeout | null>(null);

  const clearCurrentTimeout = () => {
    if (timeOutHandleRef.current) {
      clearTimeout(timeOutHandleRef.current);
      timeOutHandleRef.current = null;
    }
  };

  const show = (options: ToastOptions) => {
    const duration = options.duration ?? DEFAULT_TOAST_DURATION;

    clearCurrentTimeout();
    setToast({
      ...options,
      variant: options.variant ?? "info",
      duration,
    });

    timeOutHandleRef.current = setTimeout(
      () => setToast(null),
      duration,
    ).unref();
  };

  const value = { show };
  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast toast={toast} />
    </ToastContext.Provider>
  );
};
