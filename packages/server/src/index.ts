import "dotenv/config";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import sessions from "./routes/sessions";
import chat from "./routes/chat";
import auth from "./routes/auth";
import { requireAuth } from "./middleware/require-auth";

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
  console.error("Unhandled server error", error);
  return c.json({ error: "Internal server error" }, 500);
});

app.use("/session/*", requireAuth);
app.use("/chat/*", requireAuth);

const routes = app
  .route("/session", sessions)
  .route("/chat", chat)
  .route("/auth", auth);

export type AppType = typeof routes;

//idletimeout must be high , otherwise LLM tolls call might not complete
export default { port: 3000, fetch: app.fetch, idleTimeout: 255 };
