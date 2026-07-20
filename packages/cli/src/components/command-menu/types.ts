import type { DialogContextValue } from "../../providers/dialog/type";
import type {
  ToastContextValue,
  ToastOptions,
} from "../../providers/toast/type";

export type commandContext = {
  exit: () => void;
  toast: ToastContextValue;
  dialog: DialogContextValue;
};

export type Command = {
  name: string;
  description: string;
  value: string;
  action?: (ctx: commandContext) => void | Promise<void>;
};
