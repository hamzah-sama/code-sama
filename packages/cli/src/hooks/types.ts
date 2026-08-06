import type {
  AgentTools,
  ModeType,
  SupportedChatModelName,
} from "@code-sama/shared";
import { type InferUITools, type LanguageModelUsage, type UIMessage } from "ai";

type ChateMessageMetaData = {
  mode?: ModeType;
  model?: SupportedChatModelName;
  durationMs?: number;
  usage?: LanguageModelUsage;
};

export type ChatTools = {
  [Name in keyof InferUITools<AgentTools>]: {
    input: InferUITools<AgentTools>[Name]["input"];
    output: unknown;
  };
};

export type Message = UIMessage<ChateMessageMetaData, never, ChatTools>;
