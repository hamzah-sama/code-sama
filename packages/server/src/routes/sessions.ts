import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { findSupportedChatModel } from "@code-sama/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { db, Mode, Role, MessageStatus } from "@code-sama/database";
import type { AuthenticatedEnv } from "../middleware/require-auth";
import { isSupportedChatModel } from "../lib/models";
import { requireCreditsBalance } from "../middleware/require-credits-balance";

const createSessionSchema = z.object({
  title: z.string(),
  cwd: z.string().optional(),
  initialMessage: z
    .object({
      role: z.enum(Role),
      mode: z.enum(Mode),
      content: z.string(),
      model: z
        .string()
        .refine((name) => isSupportedChatModel(name), "Unsupported model"),
    })
    .optional(),
});

const createSessionValidator = zValidator(
  "json",
  createSessionSchema,
  (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid request body" }, 400);
    }
  },
);

const app = new Hono<AuthenticatedEnv>()
  .get("/", async (c) => {
    const userId = c.get("userId");
    const sessions = await db.session.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    return c.json(sessions);
  })
  .get("/:id", async (c) => {
    // uncomented for testing
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    // throw new HTTPException(500, {
    //   message: "Mock error: failed to get session",
    // });

    const id = c.req.param("id");
    const userId = c.get("userId");

    const session = await db.session.findUnique({
      where: {
        id,
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

    return c.json(session);
  })
  .post("/", requireCreditsBalance, createSessionValidator, async (c) => {
    // uncomented for testing

    // await new Promise((resolve) => setTimeout(resolve, 3000));

    // throw new HTTPException(500, {
    //   message: "Mock error: failed to get session",
    // });
    const userId = c.get("userId");

    const { initialMessage, ...data } = c.req.valid("json");

    const session = await db.session.create({
      data: {
        ...data,
        userId,
        ...(initialMessage && {
          messages: {
            create: {
              ...initialMessage,
              status: MessageStatus.COMPLETE,
            },
          },
        }),
      },
      include: { messages: true },
    });
    return c.json(session, 201);
  });

export default app;
