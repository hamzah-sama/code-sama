import { Hono } from "hono";
import { resumeSession } from "./resume-session";
import { addChat } from "./add-chat";
import { submitValidator } from "../../functions/submit-validator";
import type { AuthenticatedEnv } from "../../middleware/require-auth";

const app = new Hono<AuthenticatedEnv>()
  .post("/:sessionId/resume", resumeSession)

  .post("/:sessionId", submitValidator, addChat);

export default app;
