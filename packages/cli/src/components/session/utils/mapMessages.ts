import type { ClientMessagePart, Message } from "../../../hooks/types";
import {
  messagePartsSchema,
  type SupportedChatModelName,
} from "@code-sama/shared";
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

    const parsedParts =
      msg.parts === null ? null : messagePartsSchema.safeParse(msg.parts);

    const parts: ClientMessagePart[] = parsedParts?.success
      ? parsedParts.data.map((part) =>
          part.type === "tool-call"
            ? { ...part, status: "done" as const }
            : part,
        )
      : msg.content ? [{type: "text", text: msg.content}] : [];

    return {
      id: msg.id,
      role: "assistant",
      content: msg.content,
      mode: msg.mode,
      model: msg.model as SupportedChatModelName,
      parts,
      ...(msg.duration !== null
        ? { duration: prettyMs(msg.duration * 1000) }
        : {}),
      interrupted: msg.status === "INTERRUPTED",
    };
  });
};
