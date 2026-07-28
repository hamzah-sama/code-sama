import type { Mode } from "@code-sama/database";
import type { DialogContextValue } from "../../providers/dialog/type";
import type {
  ToastContextValue,
  ToastOptions,
} from "../../providers/toast/type";
import type { SupportedChatModelName } from "@code-sama/shared";

export type commandContext = {
  exit: () => void;
  toast: ToastContextValue;
  dialog: DialogContextValue;
  navigate: (url: string, options?: { replace?: boolean }) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  model: SupportedChatModelName;
  setModel: (model: SupportedChatModelName) => void;
};

export type Command = {
  name: string;
  description: string;
  value: string;
  action?: (ctx: commandContext) => void | Promise<void>;
};
