import { Hono } from "hono";
import { resumeSession } from "./resume-session";
import { addChat } from "./add-chat";
import { submitValidator } from "../../functions/submit-validator";
import type { AuthenticatedEnv } from "../../middleware/require-auth";
import { requireCreditsBalance } from "../../middleware/require-credits-balance";

const app = new Hono<AuthenticatedEnv>()
  .post("/:sessionId/resume", requireCreditsBalance, resumeSession)

  .post("/:sessionId", requireCreditsBalance, submitValidator, addChat);

export default app;
