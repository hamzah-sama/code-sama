import type { Mode } from "@code-sama/database";

type Messages = {
  role: "USER" | "ASSISTANT" | "ERROR";
  mode: Mode;
  model: string;
}[];

export const getLastUnansweredUserMessage = (messages: Messages) => {
  const lastMessage = messages.at(-1);
  if (lastMessage?.role !== "USER") return null;

  return lastMessage;
};
