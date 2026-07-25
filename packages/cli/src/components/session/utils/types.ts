import type { InferResponseType } from "hono";
import type { apiClient } from "../../../lib/api-client";

export type SessionData = InferResponseType<
  (typeof apiClient.session)[":id"]["$get"],
  200
>;
