import type { Mode } from "@code-sama/database";
import type { SupportedChatModelName } from "@code-sama/shared";
import type { ClientResponse } from "hono/client";

export type ClientMessagePart = {
  type: "text";
  text: string;
};

export type Message =
  | {
      id: string;
      role: "user";
      content: string;
      mode: Mode;
      model: SupportedChatModelName;
    }
  | {
      id: string;
      role: "assistant";
      content: string;
      mode: Mode;
      model: SupportedChatModelName;
      duration?: string;
      parts: ClientMessagePart[];
      interrupted?: boolean;
    }
  | { id: string; role: "error"; content: string };

export type StreamingState =
  | { status: "idle" }
  | {
      status: "streaming";
      parts: ClientMessagePart[];
      mode: Mode;
      model: SupportedChatModelName;
    };

export type ActiveStream = {
  requestId: string;
  mode: Mode;
  model: SupportedChatModelName;
  parts: ClientMessagePart[];
  controller: AbortController;
  interruptedCaptured: boolean;
};

export type SubmitParams = {
  userText: string;
  mode: Mode;
  model: SupportedChatModelName;
};

export type RunStreamParams = {
  mode: Mode;
  model: SupportedChatModelName;
  request: (controller: AbortController) => Promise<ClientResponse<unknown>>;
};
