import { useEffect, useState } from "react";
import type { SessionData } from "react-router";
import { mapMessages } from "./utils/mapMessages";
import { useChat } from "../../hooks/use-chat";
import { useKeyboard } from "@opentui/react";
import { MessageRenderer } from "./message-renderer";
import { BotMessage } from "../messages/bot-message";
import { useMode } from "../../providers/mode/mode-context";
import { useModel } from "../../providers/model/model-context";
import { SessionWrapper } from "./session-wrapper";
import { useLayer } from "../../providers/layer/layer-context";

interface Props {
  session: SessionData;
}

export const SessionChat = ({ session }: Props) => {
  const { mode } = useMode();
  const { model } = useModel();
  const [initialMessages] = useState(() => mapMessages(session.messages));
  const { isTopLayer } = useLayer();
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
          mode,
          model,
        })
      }
      loading={streaming.status === "streaming"}
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
          streaming={streaming.status === "streaming"}
        />
      )}
    </SessionWrapper>
  );
};
