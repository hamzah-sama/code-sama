import { Hono } from "hono";
import type { AuthenticatedEnv } from "../middleware/require-auth";
import { createCheckoutUrl, createCustomerPortalUrl } from "../lib/polar";

const app = new Hono<AuthenticatedEnv>()
  .post("/checkout", async (c) => {
    const userId = c.get("userId");
    return c.json({
      url: await createCheckoutUrl({
        externalCustomerId: userId,
        requestUrl: c.req.url,
      }),
    });
  })
  .post("/portal", async (c) => {
    const userId = c.get("userId");
    return c.json({
      url: await createCustomerPortalUrl({
        externalCustomerId: userId,
        requestUrl: c.req.url,
      }),
    });
  })
  .get("/success", (c) => {
    return c.text("Done, you can close this tab and return to code-sama");
  });

export default app;
