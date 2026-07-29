import { tool } from "ai";
import { z } from "zod";

const MAX_OUTPUT = 20_000;
const DEFAULT_TIMEOUT = 30_000;

const isWindows = process.platform === "win32";

export const createBashTool = (cwd: string) => {
  return tool({
    description:
      "Execute a shell command in the project directory. Use this for running tests, builds, git operation, package installs, and any other shell commands.",
    inputSchema: z.object({
      command: z.string().describe("The shell command to execute"),
      timeout: z
        .number()
        .describe("timeout in miliseconds (default: 30000)")
        .default(DEFAULT_TIMEOUT),
    }),
    execute: async ({ command, timeout }) => {
      try {
        const shellArgs: string[] = isWindows
          ? ["cmd", "/c", command]
          : ["bash", "-c", command];

        const proc = Bun.spawn(shellArgs, {
          cwd,
          stdout: "pipe",
          stderr: "pipe",
          env: { ...process.env, TERM: "dumb" },
        });

        const timer = setTimeout(() => {
          proc.kill();
        }, timeout);

        const [stdout, stderr] = await Promise.all([
          new Response(proc.stdout).text(),
          new Response(proc.stderr).text(),
        ]);

        const exitCode = await proc.exited;
        clearTimeout(timer);

        const truncate = (s: string) => {
          return s.length > MAX_OUTPUT
            ? s.slice(0, MAX_OUTPUT) +
                `\n... (truncated, ${s.length} total chars)`
            : s;
        };

        return {
          stdout: truncate(stdout),
          stderr: truncate(stderr),
          exitCode,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { error: `Failed to execute command : ${message}` };
      }
    },
  });
};
