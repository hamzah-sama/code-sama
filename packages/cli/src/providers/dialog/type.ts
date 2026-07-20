import type { ReactNode } from "react";

export type DialogConfig = {
  title: string;
  children: ReactNode;
};

export type DialogContextValue = {
  open: (config: DialogConfig) => void;
  close: () => void;
};
