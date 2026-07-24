import { Mode } from "@code-sama/database";
import z from "zod";
import { isSupportedChatModel } from "../lib/models";
import { zValidator } from "@hono/zod-validator";

const submitSchema = z.object({
  content: z.string(),
  mode: z.enum(Mode),
  model: z.string().refine(isSupportedChatModel, "Unsupported model"),
});

export type SubmitSchema = z.infer<typeof submitSchema>;

export const submitValidator = zValidator("json", submitSchema, (result, c) => {
  if (!result.success) {
    return c.json({ error: "Invalid request body" }, 400);
  }
});
