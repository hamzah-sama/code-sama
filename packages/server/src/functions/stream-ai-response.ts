import { db, MessageStatus, type Mode } from "@code-sama/database";
import type { conversationHistory } from "./conversation-history";
import { streamSSE } from "hono/streaming";
import { resolvedChatModel } from "../lib/models";
import { streamText as aiStreamText } from "ai";
import {
  messagePartsSchema,
  toolCallArgsSchema,
  type ChatStreamEvent,
} from "@code-sama/shared";
import type { MessagePart } from "@code-sama/shared";
import { Prisma } from "@code-sama/database";

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
  const parts: MessagePart[] = [];

  const resolvedModel = resolvedChatModel(model);

  const persistInterruptedMessage = async () => {
    const fullText = parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");

    if (fullText.length === 0 && parts.length === 0) return;
    const elapsedTime = Date.now() - startTime;

    const validatedParts: Prisma.InputJsonValue | undefined =
      parts.length > 0 ? messagePartsSchema.parse(parts) : undefined;

    await db.message.create({
      data: {
        sessionId,
        role: "ASSISTANT",
        content: fullText,
        status: MessageStatus.INTERRUPTED,
        mode,
        parts: validatedParts,
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
      providerOptions: resolvedModel.providerOptions,
    });

    for await (const part of result.stream) {
      if (stream.aborted) break;

      if (part.type === "reasoning-delta") {
        const last = parts.at(-1);
        if (last?.type === "reasoning") {
          last.text += part.text;
        } else {
          parts.push({ type: "reasoning", text: part.text });
        }
        const event: ChatStreamEvent = {
          type: "reasoning-delta",
          text: part.text,
        };
        await stream.writeSSE({
          event: "reasoning-delta",
          data: JSON.stringify(event),
        });
      }

      if (part.type === "text-delta") {
        const last = parts.at(-1);
        if (last?.type === "text") {
          last.text += part.text;
        } else {
          parts.push({ type: "text", text: part.text });
        }

        const event: ChatStreamEvent = { type: "text-delta", text: part.text };
        await stream.writeSSE({
          event: "text-delta",
          data: JSON.stringify(event),
        });
      }

      if (part.type === "tool-call") {
        const args = toolCallArgsSchema.parse(part.input);
        parts.push({
          id: part.toolCallId,
          type: "tool-call",
          name: part.toolName,
          args,
        });

        const event: ChatStreamEvent = {
          type: "tool-call",
          toolCallId: part.toolCallId,
          toolCallName: part.toolName,
          args,
        };
        await stream.writeSSE({
          event: "tool-call",
          data: JSON.stringify(event),
        });
      }

      if (part.type === "tool-result") {
        const resultStr =
          typeof part.output === "string"
            ? part.output
            : (JSON.stringify(part.output) ?? "");

        const tcPart = parts.find(
          (p): p is Extract<MessagePart, { type: "tool-call" }> =>
            p.type === "tool-call" && p.id === part.toolCallId,
        );

        if (tcPart) {
          tcPart.result = resultStr;
        }

        const event: ChatStreamEvent = {
          type: "tool-result",
          toolCallId: part.toolCallId,
          result: resultStr,
        };

        await stream.writeSSE({
          event: "tool-result",
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

    const fullText = parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");

    const validatedParts: Prisma.InputJsonValue | undefined =
      parts.length > 0 ? messagePartsSchema.parse(parts) : undefined;

    const assistantMessage = await db.message.create({
      data: {
        sessionId,
        role: "ASSISTANT",
        content: fullText,
        status: MessageStatus.COMPLETE,
        mode,
        duration: Math.round(elapsedMs / 1000),
        model,
        parts: validatedParts,
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

    const fullText = parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");
    if (fullText.length > 0) {
      await persistInterruptedMessage();
    }

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
