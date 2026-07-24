import { Hono } from "hono";
import { resumeSession } from "./resume-session";
import { addChat } from "./add-chat";
import { submitValidator } from "../../functions/submit-validator";

const app = new Hono()
  .post("/:sessionId/resume", resumeSession)

  .post("/:sessionId", submitValidator, addChat);

export default app;
