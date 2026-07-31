import { saveAuthData } from "./auth";
import open from "open";

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

type OauthState = {
  nonce: string;
  port: number;
};

const toBase64Url = (input: Uint8Array | string) => {
  return Buffer.from(input).toString("base64url");
};

const createPkceChallenge = async (verifier: string) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return toBase64Url(new Uint8Array(digest));
};

const encodeState = (state: OauthState) => {
  return toBase64Url(JSON.stringify(state));
};

const decodedState = (state: string) => {
  const [encoded] = state.split(".");
  if (!encoded) {
    throw new Error("Invalid state");
  }

  return JSON.parse(Buffer.from(encoded, "base64url").toString()) as OauthState;
};

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : String(error);
};

export const performLogin = async () => {
  const clerkFrontEndApi = process.env.CLERK_FRONTEND_API;
  const clerkClientId = process.env.CLERK_OAUTH_CLIENT_ID;
  const apiUrl = process.env.API_URL ?? "http://localhost:3000";

  if (!clerkFrontEndApi) {
    throw new Error("CLERK_FRONTEND_API must be set");
  }

  if (!clerkClientId) {
    throw new Error("CLERK_OAUTH_CLIENT_ID must be set");
  }

  const nonce = crypto.randomUUID();
  const codeVerifier = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const codeChallenge = await createPkceChallenge(codeVerifier);

  let settled = false;

  return new Promise<{ token: string }>((resolve, reject) => {
    const server = Bun.serve({
      port: 0,
      async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname !== "/callback") {
          return new Response("Not found", { status: 404 });
        }

        const error = url.searchParams.get("error");
        if (error) {
          const msg = url.searchParams.get("error_description") ?? error;
          settled = true;
          reject(new Error(msg));
          setTimeout(() => server.stop(), 500);
          return new Response(`Authenticated failed, ${msg}`, { status: 400 });
        }

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        if (!code || !state) {
          settled = true;
          reject(new Error("Missing code or state"));
          setTimeout(() => server.stop(), 500);
          return new Response("Bad request", { status: 400 });
        }

        try {
          const payload = decodedState(state);
          if (payload.nonce !== nonce) {
            throw new Error("State missmatch");
          }
        } catch (err) {
          settled = true;
          reject(err);
          setTimeout(() => server.stop(), 500);
          return new Response("Invalid state", { status: 400 });
        }

        try {
          const redirectUri = `${apiUrl}/auth/callback`;

          const tokenRes = await fetch(`${clerkFrontEndApi}/oauth/token`, {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code,
              client_id: clerkClientId,
              redirect_uri: redirectUri,
              code_verifier: codeVerifier,
            }),
          });

          if (!tokenRes.ok) {
            const details = await tokenRes.text();
            throw new Error(details || "Failed to exchange authorization code");
          }

          const tokenData = (await tokenRes.json()) as { access_token: string };
          settled = true;
          saveAuthData({ token: tokenData.access_token });
          resolve({ token: tokenData.access_token });
          setTimeout(() => server.stop(), 500);
          return new Response("Authenticated, you can close this tab!");
        } catch (err) {
          settled = true;
          reject(err);
          const message = getErrorMessage(err);
          setTimeout(() => server.stop(), 500);
          return new Response(`Authenticated failed, ${message}`, {
            status: 400,
          });
        }
      },
    });

    const port = server.port;
    if (typeof port !== "number") {
      server.stop();
      reject(new Error("Failed to start callback server"));
      return;
    }

    const state = encodeState({ port, nonce });
    const redirectUri = `${apiUrl}/auth/callback`;

    const authorizedUrl = new URL(`${clerkFrontEndApi}/oauth/authorize`);
    authorizedUrl.searchParams.set("response_type", "code");
    authorizedUrl.searchParams.set("client_id", clerkClientId);
    authorizedUrl.searchParams.set("redirect_uri", redirectUri);
    authorizedUrl.searchParams.set("scope", "openid email profile");
    authorizedUrl.searchParams.set("state", state);
    authorizedUrl.searchParams.set("prompt", "login");
    authorizedUrl.searchParams.set("code_challenge", codeChallenge);
    authorizedUrl.searchParams.set("code_challenge_method", "S256");

    void open(authorizedUrl.toString());

    setTimeout(() => {
      if (!settled) {
        settled = true;
        server.stop();
        reject(new Error("Login timed out"));
      }
    }, LOGIN_TIMEOUT_MS);
  });
};
