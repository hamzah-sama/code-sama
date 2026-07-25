import { db } from "@code-sama/database";
import { getResumableUserMessage } from "../../functions/get-resumable-message";
import { isSupportedChatModel } from "../../lib/models";
import { conversationHistory } from "../../functions/conversation-history";
import { streamSSE } from "hono/streaming";
import { streamAiResponse } from "../../functions/stream-ai-response";
import type { ChatStreamEvent } from "@code-sama/shared";
import { Context } from "hono";

const activeResumeSessionIds = new Set<string>();

type ResumeContext = Context<any, "/:sessionId">;

export const resumeSession = async (c: ResumeContext) => {
  const { sessionId } = c.req.param();

  const session = await db.session.findUnique({
    where: {
      id: sessionId,
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

  const resumableMessage = getResumableUserMessage(session.messages);

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
    return c.json({ error: "Session already has an active resume" }, 409);
  }

  activeResumeSessionIds.add(sessionId);

  const history = conversationHistory(session.messages);
  const abortController = new AbortController();

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
            abortController,
          });
        } finally {
          activeResumeSessionIds.delete(sessionId);
        }
      },
      async (err, stream) => {
        activeResumeSessionIds.delete(sessionId);
        const message = err instanceof Error ? err.message : String(err);
        const errorEvent: ChatStreamEvent = { type: "error", message };
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify(errorEvent),
        });
      },
    );
  } catch (error) {
    activeResumeSessionIds.delete(sessionId);
    throw error;
  }
};
