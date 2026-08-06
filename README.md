# CODE-SAMA

An AI coding agent that lives in your terminal.

CODE-SAMA is a TUI coding assistant built on [Bun](https://bun.sh), [OpenTUI](https://github.com/sst/opentui) + React, and the [AI SDK](https://sdk.vercel.ai). It pairs a rich terminal UI with a hosted agent backend — and it executes every tool **on your machine**, so the model can read, search, edit, and run code in your working directory without your source ever being uploaded wholesale.

```
┌──────────────────────────────────────────────────────────────┐
│  ◉ Build > claude-sonnet-4-6                                 │
│                                                              │
│  › Refactor the auth middleware to use the new session type   │
│                                                              │
│  │ Grep: AuthenticatedEnv packages/server                     │
│  │ Read file: packages/server/src/middleware/require-auth.ts  │
│  │ Edit file: packages/server/src/middleware/require-auth.ts  │
│                                                              │
│  Done — `requireAuth` now sets a typed `userId` on the Hono   │
│  context and the middleware is reused by both route groups.   │
│                                                              │
│  ◉ Build > claude-sonnet-4-6 > 4.2s                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Table of contents

- [Highlights](#highlights)
- [Architecture](#architecture)
- [Monorepo layout](#monorepo-layout)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Using the CLI](#using-the-cli)
- [Modes](#modes)
- [Agent tools](#agent-tools)
- [Models](#models)
- [Authentication](#authentication)
- [Billing and credits](#billing-and-credits)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Known gaps](#known-gaps)

---

## Highlights

| | |
|---|---|
| **Client-side tool execution** | The server declares tool *schemas* only — no `execute`. Every filesystem and shell operation runs in the CLI process, sandboxed to your `cwd`. |
| **Two-mode agent** | `PLAN` for read-only analysis, `BUILD` for full write access. One `Tab` press to switch; the toolset and system prompt change with it. |
| **Streaming, resumable sessions** | Responses stream over SSE. Full UI message history is persisted per session, so you can close the CLI and pick a conversation back up. |
| **End-to-end type safety** | Hono RPC client generated from the server's route types — the CLI gets compile-time checked routes, params, and response bodies. |
| **Usage-based billing** | Token usage is priced per model, converted to credits, and metered through Polar. Requests are gated on balance before the model is ever called. |
| **33 built-in themes** | Catppuccin, Tokyo Night, Gruvbox, Rosé Pine, Nord, Kanagawa, and more — persisted to `~/.codesama/themes.json`. |
| **`@` file mentions** | Fuzzy-complete file and folder paths inline while composing a prompt. |

---

## Architecture

CODE-SAMA is a thin-server / fat-client agent. The backend owns the model call, the system prompt, persistence, and billing. The client owns the filesystem.

```
┌─────────────────────────────── your machine ───────────────────────────────┐
│                                                                            │
│  packages/cli  ·  Bun + OpenTUI + React 19 + react-router (memory router)   │
│                                                                            │
│   ┌──────────────┐   ┌───────────────┐   ┌────────────────────────────┐     │
│   │  input bar   │   │  useChat      │   │  agentTools()              │     │
│   │  @ mentions  │──▶│  (@ai-sdk/    │◀─▶│  readFile / writeFile      │     │
│   │  / commands  │   │   react)      │   │  editFile / bash / grep    │     │
│   └──────────────┘   └───────┬───────┘   │  glob / listDirectory      │     │
│                              │           │  ── sandboxed to cwd ──    │     │
│   ~/.codesama/               │           └────────────────────────────┘     │
│     auth.json  (0600)        │                                              │
│     themes.json              │                                              │
└──────────────────────────────┼─────────────────────────────────────────────┘
                               │  POST /chat        Bearer <Clerk OAuth token>
                               │  SSE UI message stream
┌──────────────────────────────▼─────────────────────────────────────────────┐
│  packages/server  ·  Hono on Bun (:3000)                                   │
│                                                                            │
│   requireAuth ──▶ requireCreditsBalance ──▶ zValidator ──▶ handler          │
│   (Clerk)         (Polar meter balance)     (zod)                          │
│                                                                            │
│        ├─▶ buildSystemPrompt(mode)      ├─▶ getTools(mode)  [schemas only]  │
│        ├─▶ streamText(...)  ───────────────▶ Anthropic / OpenAI             │
│        └─▶ onFinish: persist messages ──▶ Postgres (Prisma)                 │
│                     price usage       ──▶ Polar events.ingest              │
└────────────────────────────────────────────────────────────────────────────┘
```

### Request lifecycle

1. You submit a prompt. `prepareSendMessagesRequest` sends only the **newest** message (or the user + tool-result pair), not the whole transcript.
2. `requireAuth` validates the Clerk OAuth bearer token and puts `userId` on the context.
3. `requireCreditsBalance` reads your Polar credits meter and rejects with `402` if the balance is at zero.
4. The body is validated with zod; `mode` and `model` must be a known mode and a supported model.
5. The server loads the session's stored history and **merges** the incoming message into it by `id` — so an edited or re-sent message replaces rather than duplicates.
6. `getTools(mode)` selects the toolset, `buildSystemPrompt(mode)` builds the instructions, and `streamText` opens the provider stream.
7. The response streams back as an AI SDK UI message stream. Tool calls arrive as parts with no result.
8. The CLI's `onToolCall` executes each tool locally and calls `addToolOutput`. Because of `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls`, the CLI automatically posts the results back, continuing the agent loop.
9. On finish, the server persists the full message array and ingests priced usage into Polar — unless the turn was aborted or still has pending tool calls.

### Why tools run client-side

Declaring tools without an `execute` function in `packages/shared/src/schema.ts` makes the AI SDK treat them as client-executed. This is the central design decision:

- Your code stays local. Only the prompt, the tool results the model asked for, and the conversation transcript cross the network.
- The agent operates on your real working tree with your real toolchain — your `bash`, your installed dependencies, your git state.
- The server stays stateless and horizontally scalable; it never needs a sandbox or a checkout.

Every path is resolved through `resolveInsideCwd`, which rejects anything that escapes the process working directory. `PLAN` mode is enforced twice — the server only sends read-only schemas, and the client re-checks the tool name against `readOnlyTools` before executing.

---

## Monorepo layout

Bun workspaces, four packages:

```
packages/
├── cli/          Terminal UI — the app you run
│   ├── bin/code-sama            executable entrypoint (loads .env, boots the TUI)
│   └── src/
│       ├── components/          screens, dialogs, message renderers, input bar
│       │   ├── command-menu/    slash-command palette
│       │   ├── file-mention/    @-path autocomplete
│       │   └── session/         chat surface + session lifecycle
│       ├── hooks/use-chat.ts    AI SDK transport + agent loop wiring
│       ├── lib/
│       │   ├── agent-tools.ts   local tool executor (the sandbox)
│       │   ├── api-client.ts    typed Hono RPC client
│       │   ├── auth.ts          ~/.codesama/auth.json token store
│       │   └── oauth.ts         PKCE login with loopback callback server
│       └── providers/           theme, mode, model, dialog, toast, layer (focus stack)
│
├── server/       Hono API
│   └── src/
│       ├── routes/              chat, sessions, auth, billing
│       ├── middleware/          require-auth, require-credits-balance
│       ├── lib/                 models, credits, polar, auth
│       └── system-prompt.ts     mode-aware prompt builder
│
├── shared/       Contracts used by both sides
│   └── src/
│       ├── models.ts            supported models + per-million-token pricing
│       └── schema.ts            modes, tool input schemas, PLAN/BUILD toolsets
│
└── database/     Prisma 7 + Postgres (pg driver adapter)
    └── prisma/schema.prisma
```

`shared` is what keeps the two runtimes honest: the same zod schemas that validate a tool call on the server parse its input on the client, and the same pricing table that renders in the model picker computes the bill.

---

## Getting started

### Prerequisites

- **Bun** 1.2+ (the whole toolchain assumes it — runtime, bundler, workspaces)
- **PostgreSQL** database
- **Clerk** application with an OAuth app configured
- **Polar** account (sandbox is fine) with a product and a credits meter
- **Anthropic** and/or **OpenAI** API key
- `bash` and `grep` on `PATH` — the `bash` and `grep` tools shell out to them

> On Windows, use Git Bash / WSL. `agentTools` spawns `bash -c` and `grep` directly.

### Install

```bash
git clone https://github.com/hamzah-sama/code-sama.git
cd code-sama
bun install
```

`bun install` runs the server's `postinstall`, which generates the Prisma client.

### Configure

Create a `.env` in the repo root — both the server and the CLI load it:

```bash
# --- AI providers (at least one) ---
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# --- Database ---
DATABASE_URL=postgresql://user:pass@host:5432/codesama?sslmode=verify-full

# --- Clerk ---
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_FRONTEND_API=https://your-app.clerk.accounts.dev
CLERK_OAUTH_CLIENT_ID=...

# --- Polar ---
POLAR_ACCESS_TOKEN=polar_at_...
POLAR_PRODUCT_ID=...
POLAR_CREDITS_METER_ID=...
POLAR_SERVER=sandbox

# --- Optional ---
API_URL=http://localhost:3000
```

### Push the schema

```bash
bun run --cwd packages/database db:push
```

> Use `db:push`, not `migrate`. The one committed migration predates a schema redesign and describes a normalized `Message` table that no longer exists — see [Known gaps](#known-gaps).

### Run

Two terminals:

```bash
bun run dev:server   # Hono on :3000, hot reload
bun run dev:cli      # the TUI
```

Inside the CLI, run `/login` to authenticate and `/upgrade` to load credits. Then type a prompt.

### Install globally

```bash
bun run link:cli
code-sama
```

---

## Environment variables

| Variable | Required | Consumed by | Notes |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | If using Claude | `@ai-sdk/anthropic` | Read implicitly by the provider |
| `OPENAI_API_KEY` | If using GPT | `@ai-sdk/openai` | Read implicitly by the provider |
| `DATABASE_URL` | ✅ | `packages/database` | Postgres connection string; throws at import if unset |
| `CLERK_SECRET_KEY` | ✅ | server | Throws at import if unset |
| `CLERK_PUBLISHABLE_KEY` | ✅ | server | Throws at import if unset |
| `CLERK_FRONTEND_API` | ✅ | CLI | Clerk FAPI origin, used for `/oauth/authorize` and `/oauth/token` |
| `CLERK_OAUTH_CLIENT_ID` | ✅ | CLI | Public client — PKCE, no secret needed |
| `POLAR_ACCESS_TOKEN` | ✅ | server | Throws at import if unset |
| `POLAR_PRODUCT_ID` | ✅ | server | The credits product offered by `/upgrade` |
| `POLAR_CREDITS_METER_ID` | ✅ | server | Meter read for balance checks |
| `POLAR_SERVER` | — | server | `sandbox` \| `production`. Defaults to `sandbox` |
| `API_URL` | — | CLI | Defaults to `http://localhost:3000` |

Two variables appear in `.env` but are **not read anywhere in the codebase**: `JWT_SECRET` and `CLERK_OAUTH_CLIENT_SECRET`. The OAuth flow is a PKCE public client, so no client secret is involved. Both are safe to delete.

---

## Using the CLI

### Slash commands

Type `/` to open the command palette.

| Command | Description |
|---|---|
| `/new` | Start a new conversation |
| `/sessions` | Browse and switch between past sessions |
| `/mode` | Pick `PLAN` or `BUILD` |
| `/model` | Pick a model |
| `/theme` | Pick from 33 themes |
| `/login` | Browser-based sign-in (PKCE) |
| `/logout` | Clear the local token |
| `/upgrade` | Open the Polar credits checkout in your browser |
| `/usage` | Open the Polar customer portal |
| `/exit` | Quit |

### Keybindings

| Key | Action |
|---|---|
| `Tab` | Toggle `PLAN` ⇄ `BUILD` |
| `@` | File / folder path autocomplete |
| `/` | Command palette |
| `↑` `↓` | Scroll the transcript (or move through a list) |
| `Esc` | Interrupt a streaming response, or close the open dialog |
| `Ctrl+C` | Handled by the focus-layer stack — the topmost layer decides |
| `Enter` | Submit / confirm selection |

Focus is managed by a **layer stack** (`providers/layer`). Dialogs push a layer; handlers guard on `isTopLayer("base")` so background shortcuts don't fire while a modal is open, and `Ctrl+C` walks the stack from the top asking each layer whether it wants to consume the key.

### Local state

| Path | Contents |
|---|---|
| `~/.codesama/auth.json` | OAuth access token, written `0600` |
| `~/.codesama/themes.json` | Selected theme name |

---

## Modes

Mode selection changes three things at once: the tools the server exposes, the system prompt, and what the client is willing to execute.

| | `PLAN` (default) | `BUILD` |
|---|---|---|
| Tools | `readFile`, `listDirectory`, `glob`, `grep` | all of `PLAN` plus `writeFile`, `editFile`, `bash` |
| Writes | none | yes |
| Prompt | analyze, research, propose, surface trade-offs | implement directly, then verify |

The CLI starts in `PLAN`. Mode is per-message metadata, so a single session can mix planning and building turns and the transcript records which mode produced each response.

---

## Agent tools

Declared in `packages/shared/src/schema.ts`, executed in `packages/cli/src/lib/agent-tools.ts`.

| Tool | Input | Behavior and limits |
|---|---|---|
| `readFile` | `path` | Truncates at 10,000 chars, reporting `truncated` + `totalLength` |
| `listDirectory` | `path` | Skips dotfiles and `node_modules`; files before directories |
| `glob` | `pattern`, `path` | `Bun.Glob`, files only, max 200 results, skips `node_modules` |
| `grep` | `pattern`, `path`, `include?` | Spawns `grep -rnE`, excludes `node_modules` and `.git`, max 50 matches |
| `writeFile` | `path`, `content` | Creates or overwrites; returns `bytesWritten` |
| `editFile` | `path`, `oldString`, `newString` | Fails unless `oldString` occurs **exactly once** |
| `bash` | `command`, `description?`, `timeOut?` | `bash -c` with `TERM=dumb`, 30s default timeout, output truncated at 20,000 chars |

**Sandbox.** Every tool resolves its path through `resolveInsideCwd`, which computes the path relative to `process.cwd()` and throws if the result escapes it. There is no allowlist for `bash` — a `BUILD`-mode agent can run arbitrary shell commands in your working directory. Launch the CLI from the project you intend it to work on, and prefer `PLAN` when you only want analysis.

---

## Models

Defined with pricing in `packages/shared/src/models.ts`. USD per million tokens:

| Model | Provider | Input | Output | Notes |
|---|---|---|---|---|
| `claude-sonnet-4-6` | Anthropic | $3.00 | $15.00 | **Default.** Extended thinking, 1200-token budget |
| `claude-opus-4-6` | Anthropic | $5.00 | $25.00 | Extended thinking, 1200-token budget |
| `claude-haiku-4-5` | Anthropic | $1.00 | $5.00 | Fastest / cheapest Claude |
| `gpt-5.4` | OpenAI | $2.50 | $15.00 | `reasoningEffort: high`, detailed summaries |
| `gpt-5.4-mini` | OpenAI | $0.75 | $4.50 | `reasoningEffort: high`, detailed summaries |
| `gpt-5.4-nano` | OpenAI | $0.20 | $1.25 | No reasoning options configured |

Provider-specific options live in `packages/server/src/lib/models.ts`. Adding a model means adding an entry to `SUPPORTED_CHAT_MODELS` and, if needed, a provider-options block — the model picker, the request validator, and the billing calculator all read from that one table.

---

## Authentication

Clerk OAuth 2.0 authorization code flow with PKCE. The CLI is a public client and never holds a secret.

```
CLI                          Browser              Clerk FAPI            Server
 │                                                                        │
 │ 1. start loopback server on an ephemeral port                           │
 │ 2. verifier = random(32), challenge = S256(verifier)                    │
 │ 3. state = base64url({ nonce, port })                                   │
 │                                                                        │
 │───── open /oauth/authorize?code_challenge=…&state=… ──▶│                │
 │                              │                         │               │
 │                              │◀─── user signs in ──────│               │
 │                              │                         │               │
 │                              │──── redirect to /auth/callback ────────▶│
 │                              │                         │  4. decode state,
 │                              │                         │     validate port
 │                              │◀─── 302 localhost:<port>/callback ──────│
 │◀───── code + state ──────────│                         │               │
 │                                                                        │
 │ 5. verify nonce matches                                                │
 │───── POST /oauth/token (code + code_verifier) ─────────▶│               │
 │◀───── access_token ────────────────────────────────────│                │
 │ 6. write ~/.codesama/auth.json (0600), stop server                      │
```

The server's `/auth/callback` exists because Clerk requires a stable, pre-registered redirect URI — it can't point at a random loopback port. So the callback lands on the server, which reads the port out of the state, validates it is an integer in `1–65535`, and bounces the browser to `localhost:<port>`. The `nonce` in the state is verified by the CLI before the code is exchanged, which is what prevents a foreign callback from injecting a code.

Login times out after 5 minutes. The token is sent as `Authorization: Bearer <token>` and validated by Clerk's backend SDK with `acceptsToken: "oauth_token"`. Any `401` from the API causes the client to clear the stored token automatically.

---

## Billing and credits

Usage-based, metered through Polar. **1 credit = $0.01 USD.**

```
usage {inputTokens, outputTokens}
   │
   ├─▶ pricing = SUPPORTED_CHAT_MODELS[model].pricing
   │
   ├─▶ costUsd = (inputTokens × inUsd + outputTokens × outUsd) / 1_000_000
   │
   ├─▶ credits = max(1, ceil(costUsd / 0.01))       ← any billable turn costs ≥ 1 credit
   │
   └─▶ polar.events.ingest({ name: "usage", metadata: { credits } })
```

Enforcement is a **pre-flight balance check**, not a reservation: `requireCreditsBalance` runs before the model call and rejects with `402` when the meter balance is `≤ 0`. A user with 1 credit remaining can therefore overspend on a single expensive turn. The balance is read fresh from Polar per request; a Polar outage returns `503` rather than granting free access, and a customer Polar has never seen (`404`) is treated as a zero balance.

Ingestion is idempotent — the event's `externalId` is `chat-message:<responseMessageId>`, so a retried write won't double-bill. Ingestion failures are logged and swallowed: a metering hiccup will never fail a response the user already received.

`/upgrade` creates a Polar checkout; `/usage` opens the customer portal. Both return a URL the CLI opens in your browser.

---

## API reference

Base URL: `http://localhost:3000`. All authenticated routes take `Authorization: Bearer <clerk-oauth-token>`.

| Method | Route | Auth | Credits | Description |
|---|---|---|---|---|
| `POST` | `/chat` | ✅ | ✅ | Stream an agent turn. Returns an SSE UI message stream |
| `GET` | `/session` | ✅ | — | List your sessions (`id`, `title`, `createdAt`), newest first |
| `GET` | `/session/:id` | ✅ | — | Fetch one session including its full message array |
| `POST` | `/session` | ✅ | ✅ | Create a session from a `{ title }` |
| `GET` | `/auth/callback` | — | — | OAuth bounce to the CLI's loopback port |
| `POST` | `/billing/checkout` | ✅ | — | `{ url }` for the credits checkout |
| `POST` | `/billing/portal` | ✅ | — | `{ url }` for the customer portal |
| `GET` | `/billing/success` | — | — | Post-checkout landing page |

### `POST /chat`

```jsonc
{
  "id": "session-uuid",
  "mode": "build",                    // "build" | "plan"
  "model": "claude-sonnet-4-6",       // must be in SUPPORTED_CHAT_MODELS
  "messages": [                       // array, min length 1
    {
      "id": "msg-1",
      "role": "user",
      "parts": [{ "type": "text", "text": "..." }]
    }
  ]
}
```

Only new messages need to be sent — the server merges them into stored history by `id`.

Responses:

| Status | Meaning |
|---|---|
| `200` | SSE stream (`start` → `text-delta` / tool parts → `finish` → `[DONE]`) |
| `400` | Body failed validation; the response includes zod `issues` |
| `401` | Missing, expired, or invalid token |
| `402` | Credits exhausted |
| `404` | Session not found, or not owned by you |
| `503` | Could not reach Polar to verify balance |

Stream metadata rides along on the `start` and `finish` parts: `mode`, `model`, plus `durationMs` and token `usage` on finish. That's what renders the `◉ Build > claude-sonnet-4-6 > 4.2s` footer under each response.

Because tool calls can take a while, the Bun server sets `idleTimeout: 255`. Lowering it will truncate long agent loops.

---

## Data model

Deliberately minimal — one table, with the transcript as a JSON column.

```prisma
model Session {
  id        String   @id @default(uuid())
  userId    String
  title     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  Json     @default("[]")

  @@index([userId])
}
```

`messages` holds an array of AI SDK `UIMessage` objects — parts, tool calls, tool results, reasoning, and per-message metadata, exactly as the client renders them. There is no `User` table; identity is Clerk's `userId`, stored as an opaque string and used for both row ownership and as the Polar `externalCustomerId`.

The tradeoff is intentional: storing UI messages verbatim means zero mapping code between the transcript, the DB, and the model — the same array is validated with `validateUIMessages` and handed straight to `convertToModelMessages`. The cost is that you can't query across messages in SQL, and a session's row grows with the conversation.

---

## Development

### Scripts

Root:

| Script | Purpose |
|---|---|
| `bun run dev:server` | Server with `--hot` reload |
| `bun run dev:cli` | CLI with `--watch` |
| `bun run build:cli` | Bundle the CLI to `packages/cli/dist` |
| `bun run link:cli` | Expose `code-sama` globally via `bun link` |

`packages/database`:

| Script | Purpose |
|---|---|
| `bun run db:generate` | Regenerate the Prisma client into `generated/prisma` |
| `bun run db:push` | Sync `schema.prisma` to the database |

### Typechecking

There's no test suite; the type system is the safety net, and it's configured strictly (`strict`, `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`).

```bash
./node_modules/.bin/tsc --noEmit -p packages/server
./node_modules/.bin/tsc --noEmit -p packages/cli
```

Run both before committing. The CLI's typecheck is the one that catches server contract drift, since `api-client.ts` is typed off `AppType`.

### Conventions

- **Add a tool** → schema in `shared/src/schema.ts` (and the right toolset), executor case in `cli/src/lib/agent-tools.ts`, description in `server/src/system-prompt.ts`.
- **Add a model** → one entry in `shared/src/models.ts`; add provider options in `server/src/lib/models.ts` only if needed.
- **Add a slash command** → one entry in `cli/src/components/command-menu/command-list.tsx`.
- **Add a theme** → one entry in `cli/src/providers/theme/theme-list.ts`.
- **Add a route** → keep it in the chained `.get()/.post()` builder so `AppType` picks it up; a route defined outside the chain is invisible to the typed client.

### Debugging the API directly

The full stack needs a real Clerk token, but you can borrow the one the CLI already stored:

```bash
TOKEN=$(node -e "console.log(require(require('os').homedir()+'/.codesama/auth.json').token)")

curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/session

curl -s -N -X POST http://localhost:3000/chat \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"id":"<session-id>","mode":"BUILD","model":"claude-haiku-4-5",
       "messages":[{"id":"u1","role":"user","parts":[{"type":"text","text":"say hi"}]}]}'
```

Use `claude-haiku-4-5` for throwaway requests — real credits are spent either way.

---

## Troubleshooting

**`Invalid request body`** — the `400` includes zod `issues`; read them. Usually `messages` isn't an array, or `model` isn't in `SUPPORTED_CHAT_MODELS`.

**`Insufficient credits balance`** — run `/upgrade`. In Polar sandbox, confirm the meter in `POLAR_CREDITS_METER_ID` is actually attached to the product.

**`Unable to verify credits balance right now`** — a `503` from the balance check. Verify `POLAR_ACCESS_TOKEN` and that `POLAR_SERVER` matches the environment your token belongs to.

**`Unauthorized, Run /login to continue`** — token missing or rejected. Note that a `501` here (not `401`) means Clerk *threw* rather than returning unauthenticated — typically a bad `CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY`.

**Login opens the browser but never completes** — `CLERK_FRONTEND_API` or `CLERK_OAUTH_CLIENT_ID` is wrong, or `<API_URL>/auth/callback` isn't registered as a redirect URI in Clerk. The flow gives up after 5 minutes.

**`Failed to start server. Is port 3000 in use?`** — a dev server is already running; reuse it rather than starting a second.

**`grep` / `bash` tools fail on Windows** — run the CLI from Git Bash or WSL. Those tools spawn the binaries directly.

**Agent refuses a path** — `path is outside the current working directory`. The sandbox is doing its job; relaunch the CLI from the directory you want it working in.

**Long tool loops cut off mid-run** — check `idleTimeout` in `packages/server/src/index.ts`.

---

## Known gaps

Honest inventory of the rough edges, for anyone picking this up:

- **The committed migration is stale.** `prisma/migrations/20260722015651_initial` creates `Role` / `Mode` / `MessageStatus` enums and a normalized `Message` table, none of which exist in the current schema. Use `db:push`; a fresh baseline migration is needed before this can deploy through `prisma migrate deploy`.
- **`writeFile` calls `mkdir` on the file path itself** rather than on its parent directory (`agent-tools.ts`), which creates a directory where the file should go.
- **No tests.** Typechecking is the only automated gate.
- **Credit enforcement is pre-flight only.** A user at 1 credit can overspend within a single turn; there's no mid-stream cutoff.
- **Sessions are never deleted.** There's no `DELETE /session/:id`, so rows accumulate.
- **`bash` is unrestricted in `BUILD` mode** — no command allowlist, no confirmation prompt before a write or a shell command.
- **Mode isn't persisted** across restarts the way the theme is; the CLI always starts in `PLAN`.

---

## Tech stack

**Runtime** Bun · **Language** TypeScript (strict) · **TUI** OpenTUI + React 19 + react-router · **API** Hono (+ RPC client, zod validator) · **AI** AI SDK v7, `@ai-sdk/anthropic`, `@ai-sdk/openai` · **DB** PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) · **Auth** Clerk (OAuth 2.0 + PKCE) · **Billing** Polar · **Validation** zod
