import { createMiddleware } from "hono/factory";
import type { AuthenticatedEnv } from "./require-auth";
import { getAvailableCreditsBalance } from "../lib/polar";

export const requireCreditsBalance = createMiddleware<AuthenticatedEnv>(
  async (c, next) => {
    try {
      const userId = c.get("userId");
      const creditsBalance = await getAvailableCreditsBalance(userId);

      console.log({
        userId,
        creditsBalance,
      });
      if (creditsBalance <= 0) {
        console.log("BLOCKED BY CREDIT MIDDLEWARE");
        return c.json(
          {
            error:
              "Insufficient credits balance. Run /upgrade to buy more credits.",
          },
          402,
        );
      }

      await next();
    } catch {
      return c.json(
        {
          error: "Unable to verify credits balance right now.",
        },
        503,
      );
    }
  },
);
