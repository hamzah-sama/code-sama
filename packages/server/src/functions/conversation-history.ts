import type { MessageStatus } from "@code-sama/database";

// strip error messages and empty assistant messages from the conversation history
export const conversationHistory = (
  messages: {
    role: "USER" | "ASSISTANT" | "ERROR";
    content: string;
    status: MessageStatus;
  }[],
) => {
  return messages.flatMap((msg) => {
    if (msg.role === "ERROR") return [];
    if (msg.role === "ASSISTANT" && msg.content.length === 0) return [];

    return [
      {
        role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      },
    ];
  });
};

