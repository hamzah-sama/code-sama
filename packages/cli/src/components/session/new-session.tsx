import { useLocation, useNavigate } from "react-router";
import { SessionWrapper } from "./session-wrapper";
import { UserMessage } from "../messages/user-message";
import { z } from "zod";
import { useEffect, useMemo, useRef } from "react";
import { apiClient } from "../../lib/api-client";
import { DEFAULT_CHAT_MODEL_NAME } from "../../../../shared/src/models";
import { getErrorMessage } from "../../lib/http-errors";
import { useToast } from "../../providers/toast/toast-context";

export const NewSession = () => {
  const newSessionStateSchema = z.object({
    message: z.string(),
  });
  const navigate = useNavigate();
  const location = useLocation();
  const hasStartedRef = useRef(false);
  const toast = useToast();
  const state = useMemo(() => {
    const parsed = newSessionStateSchema.safeParse(location.state);
    return parsed.success ? parsed.data : null;
  }, [location.state]);

  // if somehow navigate without state, redirect to the home page
  useEffect(() => {
    if (!state) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  useEffect(() => {
    if (!state || hasStartedRef.current) return;

    hasStartedRef.current = true;

    let ignore = false;

    const createSession = async () => {
      try {
        const res = await apiClient.session.$post({
          json: {
            title: state.message.slice(0, 50),
            cwd: process.cwd(),
            initialMessage: {
              role: "USER",
              mode: "BUILD",
              content: state.message,
              model: DEFAULT_CHAT_MODEL_NAME,
            },
          },
        });
        if (ignore) return;
        if (!res.ok) {
          throw new Error(await getErrorMessage(res));
        }

        const session = await res.json();
        navigate(`/session/${session.id}`, {
          replace: true,
          state: { session },
        });
      } catch (error) {
        if (ignore) return;
        toast.show({
          variant: "error",
          message:
            error instanceof Error ? error.message : "failed to create session",
        });
        navigate("/", { replace: true });
      }
    };

    createSession();
    return () => {
      ignore = true;
    };
  }, [state, navigate, toast]);

  if (!state) return;

  return (
    <SessionWrapper onSubmit={() => {}} inputDisabled loading>
      <UserMessage message={state.message} />
    </SessionWrapper>
  );
};
