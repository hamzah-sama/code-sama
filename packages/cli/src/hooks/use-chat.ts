import { useMemo } from "react";
import { apiClient } from "../lib/api-client";
import type { ChatTools, Message } from "./types";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { getAuthData } from "../lib/auth";
import { useChat as useAiChat } from "@ai-sdk/react";
import { agentTools } from "../lib/agent-tools";
import type { ModeType, SupportedChatModelName } from "@code-sama/shared";

export const useChat = (sessionId: string, initialMessages: Message[]) => {
  const transport = useMemo(() => {
    return new DefaultChatTransport<Message>({
      api: apiClient.chat.$url().toString(),
      headers() {
        const auth = getAuthData();
        return auth ? { Authorization: `Bearer ${auth.token}` } : new Headers();
      },
      prepareSendMessagesRequest({ messages }) {
        const lastMessage = messages.at(-1);
        if (!lastMessage) {
          throw new Error("No message to send");
        }

        const metadata = messages.findLast(
          (message) => message.metadata?.mode && message.metadata?.model,
        )?.metadata;

        const prevMessage = messages.at(-2);

        const requestMessage =
          prevMessage?.role === "user" && lastMessage.role === "assistant"
            ? [prevMessage, lastMessage]
            : [lastMessage];

        return {
          body: {
            id: sessionId,
            messages: requestMessage,
            mode: lastMessage.metadata?.mode ?? metadata?.mode,
            model: lastMessage.metadata?.model ?? metadata?.model,
          },
        };
      },
    });
  }, [sessionId]);

  const chat = useAiChat<Message>({
    id: sessionId,
    messages: initialMessages,
    transport,
    onToolCall({ toolCall }) {
      const mode = chat.messages.at(-1)?.metadata?.mode ?? "BUILD";

      void agentTools(toolCall.toolName, toolCall.input, mode)
        .then((output) =>
          chat.addToolOutput({
            tool: toolCall.toolName as keyof ChatTools,
            toolCallId: toolCall.toolCallId,
            output,
          }),
        )
        .catch((error) =>
          chat.addToolOutput({
            tool: toolCall.toolName as keyof ChatTools,
            toolCallId: toolCall.toolCallId,
            state: "output-error",
            errorText: error instanceof Error ? error.message : String(error),
          }),
        );
    },

    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    abort: chat.stop,
    interrupt: chat.stop,
    submit: (params: {
      userText: string;
      mode: ModeType;
      model: SupportedChatModelName;
    }) => {
      return chat.sendMessage({
        text: params.userText,
        metadata: {
          mode: params.mode,
          model: params.model,
        },
      });
    },
  };
};
