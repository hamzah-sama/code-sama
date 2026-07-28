import { useEffect, useState } from "react";
import type { SessionData } from "react-router";
import { mapMessages } from "./utils/mapMessages";
import { useKeyboardLayer } from "../../providers/keyboard/keyboard-context";
import { useChat } from "../../hooks/use-chat";
import { useKeyboard } from "@opentui/react";
import { SessionWrapper } from "./session-wrapper";
import { DEFAULT_CHAT_MODEL_NAME } from "@code-sama/shared";
import { MessageRenderer } from "./message-renderer";
import { BotMessage } from "../messages/bot-message";


interface Props{
    session : SessionData
}

export const SessionChat = ({ session }: Props) => {
  const [initialMessages] = useState(() => mapMessages(session.messages));
  const { isTopLayer } = useKeyboardLayer();
  const { messages, streaming, abort, submit, interrupt } = useChat(
    session.id,
    initialMessages,
  );

  useEffect(() => {
    return () => abort();
  }, [abort]);

  //let the user cancel a reply by pressing escape
  useKeyboard((key) => {
    if (
      key.name === "escape" &&
      isTopLayer("base") &&
      streaming.status === "streaming"
    ) {
      key.preventDefault();
      interrupt();
    }
  });

  return (
    <SessionWrapper
      onSubmit={(text) =>
        submit({
          userText: text,
          mode: "BUILD",
          model: DEFAULT_CHAT_MODEL_NAME,
        })
      }
      loading={streaming.status === "streaming"}
      interrupttible={streaming.status === "streaming"}
      sessionId={session.id}
    >
      {messages.map((msg) => (
        <MessageRenderer key={msg.id} message={msg} />
      ))}
      {streaming.status === "streaming" && (
        <BotMessage
          parts={streaming.parts}
          model={streaming.model}
          mode={streaming.mode}
          streaming = {streaming.status === 'streaming'}
        />
      )}
    </SessionWrapper>
  );
};
