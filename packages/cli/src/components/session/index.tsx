import { SessionWrapper } from "./session-wrapper";
import { apiClient } from "../../lib/api-client";
import {
  useLocation,
  useNavigate,
  useParams,
  type SessionData,
} from "react-router";
import { useToast } from "../../providers/toast/toast-context";
import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../../lib/http-errors";
import { z } from "zod";
import { SessionChat } from "./session-chat";
import type { ModeType, SupportedChatModelName } from "@code-sama/shared";

const sessionLocationSchema = z.object({
  session: z.custom<SessionData>(
    (val) => val !== null && typeof val === "object" && "id" in val,
  ),
  initialPrompt: z
    .object({
      message: z.string(),
      mode: z.custom<ModeType>(),
      model: z.custom<SupportedChatModelName>(),
    })
    .optional(),
});

export const Session = () => {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const prefetch = useMemo(() => {
    const parsed = sessionLocationSchema.safeParse(location.state);
    return parsed.success ? parsed.data : null;
  }, [location.state]);

  const [session, setSession] = useState<SessionData | null>(
    prefetch?.session ?? null,
  );

  useEffect(() => {
    if (prefetch?.session) return;
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
    return <SessionWrapper onSubmit={() => {}} sessionId={id} loading />;
  }

  return (
    <SessionChat
      key={session.id}
      session={session}
      initialPrompt={prefetch?.initialPrompt}
    />
  );
};
