export type ToastVariant = "info" | "success" | "error";

export type ToastOptions = {
  message: string;
  duration?: number;
  variant?: ToastVariant;
};

export type ToastContextValue = {
  show: (options: ToastOptions) => void;
};

export const DEFAULT_TOAST_DURATION = 3000;
