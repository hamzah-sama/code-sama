import type { SupportedChatModelName } from "@code-sama/shared";

export type ModelContextValue = {
  model: SupportedChatModelName;
  setModel: (model: SupportedChatModelName) => void;
};
