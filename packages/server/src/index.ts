import app from "./app";

Bun.serve({
  port: 3000,
  fetch: app.fetch,
  idleTimeout: 255,
});

console.log("Server running on http://localhost:3000");