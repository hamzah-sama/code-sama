import type { DialogContextValue } from "../../providers/dialog/type";
import type {
  ToastContextValue,
  ToastOptions,
} from "../../providers/toast/type";
import type { ModeType, SupportedChatModelName } from "@code-sama/shared";

export type commandContext = {
  exit: () => void;
  toast: ToastContextValue;
  dialog: DialogContextValue;
  navigate: (url: string, options?: { replace?: boolean }) => void;
  sessionId?: string;
  mode: ModeType;
  setMode: (mode: ModeType) => void;
  model: SupportedChatModelName;
  setModel: (model: SupportedChatModelName) => void;
  homescreen?: boolean;
};

export type Command = {
  name: string;
  description: string;
  value: string;
  action?: (ctx: commandContext) => void | Promise<void>;
};
