import type { Message } from "../../hooks/types";
import { BotMessage } from "../messages/bot-message";
import { ErrorMessage } from "../messages/error-message";
import { UserMessage } from "../messages/user-message";

interface Props {
  message: Message;
}

export const MessageRenderer = ({ message }: Props) => {
  if (message.role === "user") {
    return <UserMessage message={message.content} mode={message.mode} />;
  }
  if (message.role === "error") {
    return <ErrorMessage message={message.content} />;
  }

  return (
    <BotMessage
      parts={message.parts}
      model={message.model}
      mode={message.mode}
      duration={message.duration}
      streaming={false}
      interrupted={message.interrupted}
    />
  );
};
