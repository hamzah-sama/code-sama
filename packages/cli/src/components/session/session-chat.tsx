import { useEffect, useRef, useState } from "react";
import type { SessionData } from "react-router";
import { useChat } from "../../hooks/use-chat";
import { useKeyboard } from "@opentui/react";
import { MessageRenderer } from "./message-renderer";
import { BotMessage } from "../messages/bot-message";
import { useMode } from "../../providers/mode/mode-context";
import { useModel } from "../../providers/model/model-context";
import { SessionWrapper } from "./session-wrapper";
import { useLayer } from "../../providers/layer/layer-context";
import type { ModeType, SupportedChatModelName } from "@code-sama/shared";
import type { Message } from "../../hooks/types";
import { ErrorMessage } from "../messages/error-message";

interface Props {
  session: SessionData;
  initialPrompt?: {
    message: string;
    mode: ModeType;
    model: SupportedChatModelName;
  };
}

export const SessionChat = ({ session, initialPrompt }: Props) => {
  const { mode } = useMode();
  const { model } = useModel();
  const [initialMessages] = useState(
    () => session.messages as unknown as Message[],
  );
  const { isTopLayer } = useLayer();
  const { messages, status, abort, submit, interrupt, error } = useChat(
    session.id,
    initialMessages,
  );

  const hasSubmittedInitialPromptRef = useRef(false);

  useEffect(() => {
    return () => void abort();
  }, [abort]);

  //let the user cancel a reply by pressing escape
  useKeyboard((key) => {
    if (key.name === "escape" && isTopLayer("base") && status === "streaming") {
      key.preventDefault();
      interrupt();
    }
  });

  useEffect(() => {
    if (!initialPrompt || hasSubmittedInitialPromptRef.current) return;
    hasSubmittedInitialPromptRef.current = true;
    void submit({
      userText: initialPrompt.message,
      mode: initialPrompt.mode,
      model: initialPrompt.model,
    });
  }, [submit, initialPrompt]);

  return (
    <SessionWrapper
      onSubmit={(text) =>
        submit({
          userText: text,
          mode,
          model,
        })
      }
      loading={status === "streaming" || status === "submitted"}
      sessionId={session.id}
    >
      {messages.map((msg) => (
        <MessageRenderer key={msg.id} message={msg} />
      ))}
      {error && <ErrorMessage message={error.message} />}
    </SessionWrapper>
  );
};
