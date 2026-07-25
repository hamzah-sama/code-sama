import type { Message } from "../../../hooks/types";
import type { SupportedChatModelName } from "@code-sama/shared";
import prettyMs from "pretty-ms";
import type { SessionData } from "./types";


export const mapMessages = (messages: SessionData["messages"]): Message[] => {
  return messages.map((msg): Message => {
    if (msg.role === "ERROR") {
      return {
        id: msg.id,
        role: "error",
        content: msg.content,
      };
    }

    if (msg.role === "USER") {
      return {
        id: msg.id,
        role: "user",
        content: msg.content,
        mode: msg.mode,
        model: msg.model as SupportedChatModelName,
      };
    }

    return {
      id: msg.id,
      role: "assistant",
      content: msg.content,
      mode: msg.mode,
      model: msg.model as SupportedChatModelName,
      parts: [{ type: "text", text: msg.content }],
      ...(msg.duration !== null
        ? { duration: prettyMs(msg.duration * 1000) }
        : {}),
      interrupted: msg.status === 'INTERRUPTED',
    };
  });
};
