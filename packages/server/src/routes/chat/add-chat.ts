import { db, MessageStatus } from "@code-sama/database";
import { Context } from "hono";
import type { SubmitSchema } from "../../functions/submit-validator";
import { conversationHistory } from "../../functions/conversation-history";
import { streamSSE } from "hono/streaming";
import { streamAiResponse } from "../../functions/stream-ai-response";
import type { ChatStreamEvent } from "@code-sama/shared";

type AddchatContext = Context<
  any,
  "/:sessionId",
  { in: { json: SubmitSchema }; out: { json: SubmitSchema } }
>;
export const addChat = async (c: AddchatContext) => {
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

  const { content, mode, model } = c.req.valid("json");

  await db.message.create({
    data: {
      sessionId,
      role: "USER",
      content,
      status: MessageStatus.COMPLETE,
      mode,
      model,
    },
  });

  const history = conversationHistory([
    ...session.messages,
    { role: "USER", content, status: MessageStatus.COMPLETE },
  ]);

  const abortController = new AbortController();

  return streamSSE(
    c,
    async (stream) => {
      stream.onAbort(() => {
        abortController.abort();
      });

      await streamAiResponse(stream, {
        sessionId,
        model,
        cwd: session.cwd,
        history,
        mode,
        abortController,
      });
    },

    async (err, stream) => {
      const message = err instanceof Error ? err.message : String(err);

      const errorEvent: ChatStreamEvent = { type: "error", message };
      await stream.writeSSE({
        event: "error",
        data: JSON.stringify(errorEvent),
      });
    },
  );
};
