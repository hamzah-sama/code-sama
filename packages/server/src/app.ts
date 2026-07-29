import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import sessions from "./routes/sessions.js";
import chat from "./routes/chat/index.js";

const app = new Hono();

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json(
      {
        error: error.message || "Request failed",
      },
      error.status,
    );
  }

  console.error(error);

  return c.json(
    {
      error: "Internal server error",
    },
    500,
  );
});

export const routes = app
  .route("/session", sessions)
  .route("/chat", chat);

export type AppType = typeof routes;

export default app;