import type { Message } from "../../hooks/types";
import { BotMessage } from "../messages/bot-message";
import { UserMessage } from "../messages/user-message";

interface Props {
  message: Message;
}

export const MessageRenderer = ({ message }: Props) => {
  if (message.role === "user") {
    const text = message.parts
      .filter((msg) => msg.type === "text")
      .map((msg) => msg.text)
      .join("");
    return (
      <UserMessage message={text} mode={message.metadata?.mode ?? "BUILD"} />
    );
  }

  return (
    <BotMessage
      parts={message.parts}
      model={message.metadata?.model ?? "unknown"}
      mode={message.metadata?.mode ?? "BUILD"}
      durationMs={message.metadata?.durationMs}
      streaming={false}
    />
  );
};
