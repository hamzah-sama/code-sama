import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import sessions from "./routes/sessions";

const app = new Hono();

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({
      status: error.status,
      message: error.message || "Request failed",
    });
  }
  console.error("Unhandled server error", error);
  return c.json({ error: "Internal server error" }, 500);
});

const routes = app.route("/session", sessions);

export type AppType = typeof routes;

//idletimeout must be high , otherwise LLM tolls call might not complete
export default { port: 3000, fetch: app.fetch, idleTimeout: 255 };
