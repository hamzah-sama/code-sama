import { Hono } from "hono";
import { requireCreditsBalance } from "../../middleware/require-credits-balance";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { getTools, modeSchema } from "@code-sama/shared";
import { isSupportedChatModel, resolvedChatModel } from "../../lib/models";
import type { CodeSamaUIMessage } from "./type";
import { db, Prisma } from "@code-sama/database";
import {
  convertToModelMessages,
  generateId,
  streamText,
  validateUIMessages,
  type LanguageModelUsage,
} from "ai";
import { buildSystemPrompt } from "../../system-prompt";
import { calculateCreditsForUsage } from "../../lib/credits";
import { ingestAiUsage } from "../../lib/polar";

const messageSchema = z.custom<CodeSamaUIMessage>(
  (value) =>
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    "parts" in value,
);

const submitSchema = z.object({
  id: z.string(),
  messages: z.array(messageSchema).min(1),
  mode: modeSchema,
  model: z
    .string()
    .refine((name) => isSupportedChatModel(name), "Unsupported model"),
});


const submitValidator = zValidator("json", submitSchema, (result, c) => {
  if (!result.success) {
    return c.json(
      { error: "Invalid request body", issues: result.error.issues },
      400,
    );
  }
});

const hasPendingToolsCall = (message: CodeSamaUIMessage) => {
  return message.parts.some((part) => {
    if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
      const state = (part as { state?: string }).state;
      return state !== "output-available" && state !== "output-error";
    }

    return false;
  });
};

const app = new Hono().post(
  "/",
  requireCreditsBalance,
  submitValidator,
  async (c) => {
    const userId = c.get("userId");
    const { id, messages, mode, model } = c.req.valid("json");

    const session = await db.session.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    const startTime = Date.now();

    const previousMessage = Array.isArray(session.messages)
      ? (session.messages as unknown as CodeSamaUIMessage[])
      : [];

    const mergedMessages = [...previousMessage];
    for (const message of messages) {
      const incomingMessage = {
        ...message,
        metadata: { mode, model, ...message.metadata },
      } satisfies CodeSamaUIMessage;

      const existingMessageIndex = previousMessage.findIndex(
        (m) => m.id === message.id,
      );

      if (existingMessageIndex !== -1) {
        mergedMessages[existingMessageIndex] = incomingMessage;
      } else {
        mergedMessages.push(incomingMessage);
      }
    }

    const tools = getTools(mode);

    const nextMessage = await validateUIMessages<CodeSamaUIMessage>({
      messages: mergedMessages,
      tools,
    });

    const modelMessages = await convertToModelMessages(nextMessage, { tools });

    const resolvedModel = resolvedChatModel(model);
    let completedMessage: LanguageModelUsage | null = null;

    const results = streamText({
      model: resolvedModel.model,
      messages: modelMessages,
      system: buildSystemPrompt({ mode }),
      tools,
      providerOptions: resolvedModel.providerOptions,
      onFinish(event) {
        completedMessage = event.usage;
      },
    });

    return results.toUIMessageStreamResponse<CodeSamaUIMessage>({
      originalMessages: nextMessage,
      generateMessageId: generateId,
      messageMetadata({ part }) {
        if (part.type === "start") {
          return {
            mode,
            model,
          };
        }
        if (part.type !== "finish") return undefined;

        return {
          mode,
          model,
          durationMs: Date.now() - startTime,
          ...(completedMessage ? { usage: completedMessage } : {}),
        };
      },

      async onFinish(event) {
        if (event.isAborted) return;
        if (hasPendingToolsCall(event.responseMessage)) return;

        await db.session.update({
          where: {
            id,
          },
          data: {
            messages: event.messages as unknown as Prisma.InputJsonValue,
          },
        });

        if (!completedMessage) return;

        try {
          const billableUsage = calculateCreditsForUsage({
            provider: resolvedModel.provider,
            model: resolvedModel.modelName,
            usage: completedMessage,
          });

          await ingestAiUsage({
            externalCustomerId: userId,
            eventId: `chat-message:${event.responseMessage.id}`,
            credits: billableUsage.credits,
          });
        } catch (error) {
          console.error("Failed to ingest AI usage for chat message", {
            error,
            sessionId: id,
            messageId: event.responseMessage.id,
            userId,
          });
        }
      },
      onError(error) {
        return error instanceof Error ? error.message : String(error);
      },
    });
  },
);

export default app;
