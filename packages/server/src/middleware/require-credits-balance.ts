import { createMiddleware } from "hono/factory";
import type { AuthenticatedEnv } from "./require-auth";
import { getAvailableCreditsBalance } from "../lib/polar";

export const requireCreditsBalance = createMiddleware<AuthenticatedEnv>(
  async (c, next) => {
    const userId = c.get("userId");
    let creditsBalance: number;
    try {
      creditsBalance = await getAvailableCreditsBalance(userId);
    } catch {
      return c.json(
        {
          error: "Unable to verify credits balance right now.",
        },
        503,
      );
    }
    if (creditsBalance <= 0) {
      return c.json(
        {
          error:
            "Insufficient credits balance. Run /upgrade to buy more credits.",
        },
        402,
      );
    }

    await next();
  },
);
