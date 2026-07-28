import {
  DEFAULT_CHAT_MODEL_NAME,
  type SupportedChatModelName,
} from "@code-sama/shared";
import { useState } from "react";
import { modelContext } from "./model-context";

interface Props {
  children: React.ReactNode;
}

export const ModelProvider = ({ children }: Props) => {
  const [model, setModel] = useState<SupportedChatModelName>(
    DEFAULT_CHAT_MODEL_NAME,
  );
  return (
    <modelContext.Provider value={{ model, setModel }}>
      {children}
    </modelContext.Provider>
  );
};
