import type { InferResponseType } from "hono";
import { SessionWrapper } from "./session-wrapper";
import { apiClient } from "../../lib/api-client";
import { z } from "zod";
import { UserMessage } from "../messages/user-message";
import { ErrorMessage } from "../messages/error-message";
import { BotMessage } from "../messages/bot-message";
import { useLocation, useNavigate, useParams } from "react-router";
import { useToast } from "../../providers/toast/toast-context";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../../lib/http-errors";

type SessionData = InferResponseType<
  (typeof apiClient.session)[":id"]["$get"],
  200
>;

type message = {
  msg: SessionData["messages"][number];
};

const sessionLocationSchema = z.object({
  session: z.custom<SessionData>(
    (val) => val !== null && typeof val === "object" && "id" in val,
  ),
});

const ChatMessage = ({ msg }: message) => {
  if (msg.role === "USER") {
    return <UserMessage message={msg.content} />;
  }
  if (msg.role === "ERROR") {
    return <ErrorMessage message={msg.content} />;
  }

  return <BotMessage content={msg.content} model={msg.model} />;
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

  const handleSubmit = useCallback(
    (text: string) => {
      navigate("/session/new", { state: { message: text } });
    },
    [navigate],
  );

  return (
    <SessionWrapper onSubmit={handleSubmit}>
      {session.messages.map((msg) => (
        <ChatMessage key={msg.id} msg={msg} />
      ))}
    </SessionWrapper>
  );
};
