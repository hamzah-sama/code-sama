import { db } from "@code-sama/database";
import { isSupportedChatModel } from "../../lib/models";
import { conversationHistory } from "../../functions/conversation-history";
import { streamSSE } from "hono/streaming";
import { streamAiResponse } from "../../functions/stream-ai-response";
import type { ChatStreamEvent } from "@code-sama/shared";
import { Context } from "hono";
import { getLastUnansweredUserMessage } from "../../functions/get-resumable-message";

const activeResumeSessionIds = new Set<string>();

type ResumeContext = Context<any, "/:sessionId">;

export const resumeSession = async (c: ResumeContext) => {
  const { sessionId } = c.req.param();
  const userId = c.get("userId");

  const session = await db.session.findUnique({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  const resumableMessage = getLastUnansweredUserMessage(session.messages);

  if (!resumableMessage) {
    return c.json({ error: "Session has no user message to resume" }, 409);
  }

  if (!isSupportedChatModel(resumableMessage.model)) {
    return c.json(
      {
        error: `Session uses an unsupported model: ${resumableMessage.model}`,
      },
      409,
    );
  }

  if (activeResumeSessionIds.has(sessionId)) {
    return c.json(
      { error: `Session already has an active resume ${session.title}` },
      409,
    );
  }

  activeResumeSessionIds.add(sessionId);

  const history = conversationHistory(session.messages);
  const abortController = new AbortController();

  const cleanup = () => {
    if (activeResumeSessionIds.has(sessionId)) {
      activeResumeSessionIds.delete(sessionId);
    }
  };

  try {
    return streamSSE(
      c,
      async (stream) => {
        stream.onAbort(() => {
          abortController.abort();
        });

        try {
          await streamAiResponse(stream, {
            mode: resumableMessage.mode,
            model: resumableMessage.model,
            sessionId,
            history,
            cwd: session.cwd,
            abortController,
          });
        } finally {
          cleanup();
        }
      },
      async (err, stream) => {
        cleanup();
        const message = err instanceof Error ? err.message : String(err);
        const errorEvent: ChatStreamEvent = { type: "error", message };
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify(errorEvent),
        });
      },
    );
  } catch (error) {
    cleanup();
    throw error;
  }
};
