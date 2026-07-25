import { EventSourceParserStream } from "eventsource-parser/stream";
import prettyMs from "pretty-ms";
import type { ClientResponse } from "hono/client";
import { chartStreamEventSchema } from "@code-sama/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../lib/http-errors";
import { apiClient } from "../lib/api-client";
import type {
  ActiveStream,
  ClientMessagePart,
  Message,
  RunStreamParams,
  StreamingState,
  SubmitParams,
} from "./types";

export const useChat = (sessionId: string, initialMessages: Message[]) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [streaming, setStreaming] = useState<StreamingState>({
    status: "idle",
  });

  const activeStreamRef = useRef<ActiveStream | null>(null);

  const updateMessages = useCallback(
    (updater: (prev: Message[]) => Message[]) => {
      setMessages((prev) => updater(prev));
    },
    [],
  );

  const isActiveRequest = useCallback((requestId: string) => {
    return activeStreamRef.current?.requestId === requestId;
  }, []);

  const emitParts = useCallback(
    (requestId: string, parts: ClientMessagePart[]) => {
      if (!isActiveRequest(requestId)) return;
      const snapshot = [...parts];
      const activeStream = activeStreamRef.current;
      if (!activeStream) return;

      activeStream.parts = snapshot;

      setStreaming({
        status: "streaming",
        mode: activeStream.mode,
        model: activeStream.model,
        parts: snapshot,
      });
    },
    [isActiveRequest],
  );

  const captureInterruptedMessage = useCallback(
    (activeStream: ActiveStream) => {
      if (activeStream.interruptedCaptured || activeStream.parts.length === 0)
        return;

      activeStream.interruptedCaptured = true;
      const parts = [...activeStream.parts];

      const fullText = parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("");

      updateMessages((prev) => {
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: fullText,
            mode: activeStream.mode,
            model: activeStream.model,
            parts,
            interrupted: true,
          },
        ];
      });
    },
    [],
  );

  const clearStream = useCallback(
    (requestId: string) => {
      if (!isActiveRequest(requestId)) return;
      activeStreamRef.current = null;
      setStreaming({ status: "idle" });
    },
    [isActiveRequest],
  );

  const handleStream = useCallback(
    async (response: ClientResponse<unknown>, activeStream: ActiveStream) => {
      if (!isActiveRequest(activeStream.requestId)) return;
      if (!response.ok) {
        const message = await getErrorMessage(response);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "error",
            content: message,
          },
        ]);
        return;
      }
      const parts: ClientMessagePart[] = [];

      const stream = response
        .body!.pipeThrough(new TextDecoderStream())
        .pipeThrough(new EventSourceParserStream());

      for await (const { data } of stream) {
        if (!isActiveRequest(activeStream.requestId)) return;
        let event;

        try {
          event = chartStreamEventSchema.parse(JSON.parse(data));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Invalid streamevent";
          updateMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "error", content: message },
          ]);
          break;
        }

        switch (event.type) {
          case "text-delta":
            {
              const last = parts.at(-1);
              if (last?.type === "text") {
                last.text += event.text;
              } else {
                parts.push({ type: "text", text: event.text });
              }
              emitParts(activeStream.requestId, parts);
            }
            break;
          case "done": {
            if (!isActiveRequest(activeStream.requestId)) return;

            let fullText = parts
              .filter((p) => p.type === "text")
              .map((p) => p.text)
              .join("");

            if (fullText.length === 0) {
              const sessionRes = await apiClient.session[":id"].$get({
                param: { id: sessionId },
              });
              if (sessionRes.ok) {
                const session = await sessionRes.json();
                const saved = session.messages.find(
                  (msg) => msg.id === event.messageId,
                );
                if (saved?.role === "ASSISTANT") {
                  fullText = saved.content;
                  if (fullText.length > 0) {
                    parts.push({ type: "text", text: fullText });
                  }
                }
              }
            }

            updateMessages((prev) => [
              ...prev,
              {
                id: event.messageId,
                role: "assistant",
                content: fullText,
                mode: activeStream.mode,
                model: activeStream.model,
                duration: prettyMs(event.durationMs),
                parts: [...parts],
              },
            ]);
            break;
          }

          case "error": {
            updateMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "error",
                content: event.message,
              },
            ]);
            break;
          }

          default:
        }
      }
    },
    [updateMessages, emitParts, isActiveRequest, sessionId],
  );

  const runStream = useCallback(
    async ({ mode, model, request }: RunStreamParams) => {
      const controller = new AbortController();
      const activeStream: ActiveStream = {
        requestId: crypto.randomUUID(),
        mode,
        model,
        parts: [],
        controller,
        interruptedCaptured: false,
      };
      activeStreamRef.current = activeStream;
      setStreaming({
        status: "streaming",
        parts: [],
        mode,
        model,
      });

      try {
        const response = await request(controller);
        await handleStream(response, activeStream);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        if (!isActiveRequest(activeStream.requestId)) return;

        const msg = error instanceof Error ? error.message : String(error);

        updateMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "error",
            content: msg,
          },
        ]);
      } finally {
        clearStream(activeStream.requestId);
      }
    },
    [isActiveRequest, handleStream, updateMessages, clearStream],
  );

  const stopActiveStream = useCallback(
    (capturePartial: boolean) => {
      const activeStream = activeStreamRef.current;
      if (!activeStream) return;

      if (capturePartial) {
        captureInterruptedMessage(activeStream);
      }

      activeStreamRef.current = null;
      setStreaming({ status: "idle" });
      activeStream.controller.abort();
    },
    [captureInterruptedMessage],
  );

  const resume = useCallback(
    async ({ mode, model }: Omit<SubmitParams, "userText">) => {
      await runStream({
        mode,
        model,
        request: async (controller) => {
          return apiClient.chat[":sessionId"].resume.$post(
            { param: { sessionId } },
            { init: { signal: controller.signal } },
          );
        },
      });
    },
    [runStream, sessionId],
  );

  const hasAutoStreamRef = useRef(false);
  useEffect(() => {
    const last = initialMessages.at(-1);
    if (!last || last.role !== "user") return;
    if (hasAutoStreamRef.current) return;

    hasAutoStreamRef.current = true;
    void resume({ mode: last.mode, model: last.model });
  }, [initialMessages, resume]);

  const submit = useCallback(
    async ({ mode, model, userText }: SubmitParams) => {
      // show the partial answer before sending next message
      stopActiveStream(true);

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: userText,
        mode,
        model,
      };

      updateMessages((prev) => [...prev, userMessage]);

      await runStream({
        mode,
        model,
        request: async (controller) => {
          return apiClient.chat[":sessionId"].$post(
            { param: { sessionId }, json: { content: userText, mode, model } },
            { init: { signal: controller.signal } },
          );
        },
      });
    },

    [runStream, updateMessages, sessionId, stopActiveStream],
  );

  const abort = useCallback(() => {
    stopActiveStream(false);
  }, [stopActiveStream]);

  const interrupt = useCallback(() => {
    stopActiveStream(true);
  }, [stopActiveStream]);

  return { messages, submit, abort, streaming, interrupt };
};
