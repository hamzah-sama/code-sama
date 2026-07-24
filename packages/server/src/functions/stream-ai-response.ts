import { db, MessageStatus, type Mode } from "@code-sama/database";
import type { conversationHistory } from "./conversation-history";
import type { streamSSE } from "hono/streaming";
import { resolvedChatModel } from "../lib/models";
import { streamText as aiStreamText } from "ai";
import type { ChatStreamEvent } from "@code-sama/shared";

type StreamParams = {
  mode: Mode;
  model: string;
  sessionId: string;
  history: ReturnType<typeof conversationHistory>;
  abortController: AbortController;
};

export const streamAiResponse = async (
  stream: Parameters<Parameters<typeof streamSSE>[1]>[0],
  params: StreamParams,
) => {
  const { mode, model, sessionId, history, abortController } = params;
  const startTime = Date.now();
  const resolvedModel = resolvedChatModel(model);

  let fullText = "";

  const persistInterruptedMessage = async () => {
    if (fullText.length === 0) return;
    const elapsedTime = Date.now() - startTime;
    await db.message.create({
      data: {
        sessionId,
        role: "ASSISTANT",
        content: fullText,
        status: MessageStatus.INTERRUPTED,
        mode,
        duration: Math.round(elapsedTime / 1000),
        model,
      },
    });
  };

  try {
    const result = aiStreamText({
      model: resolvedModel.model,
      messages: history,
      abortSignal: abortController.signal,
    });

    for await (const part of result.stream) {
      if (stream.aborted) return;

      if (part.type === "text-delta") {
        fullText += part.text;
        const event: ChatStreamEvent = { type: "text-delta", text: part.text };
        await stream.writeSSE({
          event: "text-delta",
          data: JSON.stringify(event),
        });
      }
      if (part.type === "error") {
        throw part.error;
      }
    }

    if (stream.aborted || abortController.signal.aborted) {
      await persistInterruptedMessage();
      return;
    }

    const elapsedMs = Date.now() - startTime;

    const assistantMessage = await db.message.create({
      data: {
        sessionId,
        role: "ASSISTANT",
        content: fullText,
        status: MessageStatus.COMPLETE,
        mode,
        duration: Math.round(elapsedMs / 1000),
        model,
      },
    });

    const doneEvent: ChatStreamEvent = {
      type: "done",
      messageId: assistantMessage.id,
      durationMs: elapsedMs,
    };

    await stream.writeSSE({ event: "done", data: JSON.stringify(doneEvent) });
  } catch (error) {
    if (abortController.signal.aborted) {
      await persistInterruptedMessage();
      return;
    }

    const message = error instanceof Error ? error.message : String(error);

    await db.message.create({
      data: {
        sessionId,
        role: "ERROR",
        content: message,
        status: MessageStatus.COMPLETE,
        mode,
        model,
      },
    });

    const errorEvent: ChatStreamEvent = { type: "error", message };
    await stream.writeSSE({ event: "error", data: JSON.stringify(errorEvent) });
  }
};
