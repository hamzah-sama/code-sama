import type { ModeType, AgentTools } from "@code-sama/shared";
import {
  type InferUITools,
  type LanguageModelUsage,
  type UIMessage,
} from "ai";

type ChatMessageMetaData = {
  mode?: ModeType;
  model?: string;
  durationMs?: number;
  usage?: LanguageModelUsage;
};


type Tools = InferUITools<AgentTools>;

export type CodeSamaUIMessage = UIMessage<ChatMessageMetaData, never, Tools>;
