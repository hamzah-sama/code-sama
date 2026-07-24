import type { InferResponseType } from "hono";
import { SessionWrapper } from "./session-wrapper";
import { apiClient } from "../../lib/api-client";
import { UserMessage } from "../messages/user-message";
import { ErrorMessage } from "../messages/error-message";
import { BotMessage } from "../messages/bot-message";
import { useLocation, useNavigate, useParams } from "react-router";
import { useToast } from "../../providers/toast/toast-context";
import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../../lib/http-errors";
import {
  DEFAULT_CHAT_MODEL_NAME,
  type SupportedChatModelName,
} from "@code-sama/shared";
import { useChat } from "../../hooks/use-chat";
import prettyMs from "pretty-ms";
import { z } from "zod";
import type { Message } from "../../hooks/types";
import { useKeyboardLayer } from "../../providers/keyboard/keyboard-context";
import { useKeyboard } from "@opentui/react";

type SessionData = InferResponseType<
  (typeof apiClient.session)[":id"]["$get"],
  200
>;

const sessionLocationSchema = z.object({
  session: z.custom<SessionData>(
    (val) => val !== null && typeof val === "object" && "id" in val,
  ),
});

const mapDbMessages = (dbMessages: SessionData["messages"]): Message[] => {
  return dbMessages.map((msg): Message => {
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
      interrupted: msg.status === "INTERRUPTED",
    };
  });
};

const ChatMessage = ({ msg }: { msg: Message }) => {
  if (msg.role === "user") {
    return <UserMessage message={msg.content} />;
  }
  if (msg.role === "error") {
    return <ErrorMessage message={msg.content} />;
  }

  return (
    <BotMessage
      parts={msg.parts}
      model={msg.model}
      mode={msg.mode}
      duration={msg.duration}
      streaming={false}
      interrupted={msg.interrupted}
    />
  );
};

const SessionChat = ({ session }: { session: SessionData }) => {
  const [initialMessages] = useState(() => mapDbMessages(session.messages));
  const { isTopLayer } = useKeyboardLayer();
  const { messages, streaming, abort, submit, interrupt } = useChat(
    session.id,
    initialMessages,
  );

  useEffect(() => {
    return () => abort();
  }, [abort]);

  const [isInterrupted, setIsInterrupted] = useState(false);

  //let the user cancel a reply by pressing escape
  useKeyboard((key) => {
    if (
      key.name === "escape" &&
      isTopLayer("base") &&
      streaming.status === "streaming" &&
      !isInterrupted
    ) {
      key.preventDefault();
      interrupt();
      setIsInterrupted(true);
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
    >
      {messages.map((msg) => (
        <ChatMessage key={msg.id} msg={msg} />
      ))}
      {streaming.status === "streaming" && (
        <BotMessage
          parts={streaming.parts}
          model={streaming.model}
          mode={streaming.mode}
          streaming
          interrupted={isInterrupted}
        />
      )}
    </SessionWrapper>
  );
};

export const Session = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const prefetch = useMemo(() => {
    const parsed = sessionLocationSchema.safeParse(location.state);
    return parsed.success ? parsed.data.session : null;
  }, [location.state]);

  const [session, setSession] = useState<SessionData | null>(prefetch);

  useEffect(() => {
    if (prefetch) return;
    setSession(null);
    if (!id) return;

    let ignore = false;

    const fetchSession = async () => {
      try {
        const res = await apiClient.session[":id"].$get({ param: { id } });
        if (ignore) return;
        if (!res.ok) {
          throw new Error(await getErrorMessage(res));
        }
        setSession(await res.json());
      } catch (error) {
        if (ignore) return;
        toast.show({
          variant: "error",
          message:
            error instanceof Error ? error.message : "failed to get session",
        });
        navigate("/", { replace: true });
      }
    };

    fetchSession();

    return () => {
      ignore = true;
    };
  }, [id, prefetch, navigate, toast]);

  if (!session) {
    return <SessionWrapper inputDisabled onSubmit={() => {}} />;
  }

  return <SessionChat key={session.id} session={session} />;
};
