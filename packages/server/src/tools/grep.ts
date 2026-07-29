import { tool } from "ai";
import { z } from "zod";
import { resolve, relative } from "path";

const MAX_MATCHES = 50;

export const createGrepTool = (cwd: string) => {
  return tool({
    description:
      "Search file contents using regex pattern. Returns matching lines with file paths and line numbers. Skips hidden directory, node_modules, and binary files.",
    inputSchema: z.object({
      pattern: z.string().describe("Regex pattern to  search for"),
      path: z
        .string()
        .describe("Relative directory to search in (defaults to  project root)")
        .default("."),
      include: z
        .string()
        .describe("Glob pattern to filter files (e.g. '*.ts', '*.tsx')")
        .optional(),
    }),
    execute: async ({ path, pattern, include }) => {
      const resolvedPath = resolve(cwd, path);

      if (!resolvedPath.startsWith(cwd)) {
        return { error: "Path is outside of the project directory" };
      }

      try {
        const args = [
          "-rn",
          "--color=never",
          "--exclude-dir=node_modules",
          "--exclude-dir=.git",
          "-E",
        ];

        if (include) {
          args.push(`--include=${include}`);
        }

        args.push(pattern, resolvedPath);

        const proc = Bun.spawn(["grep", ...args], {
          stdout: "pipe",
          stderr: "pipe",
          cwd,
        });

        const [stdout, stderr] = await Promise.all([
          new Response(proc.stdout).text(),
          new Response(proc.stderr).text(),
        ]);

        const exitCode = await proc.exited;

        if (exitCode !== 0 && exitCode !== 1) {
          return {
            error: `grep failed: ${stderr.trim()}`,
          };
        }

        if (!stdout.trim()) {
          return { matches: [], message: "No matches found" };
        }

        const lines = stdout.trim().split("\n");
        const matches: { file: string; line: number; content: string }[] = [];
        let truncate = false;
        for (const line of lines) {
          if (matches.length >= MAX_MATCHES) {
            truncate = true;
            break;
          }

          const match = line.match(/^(.+?):(\d+):(.*)$/);
          if (match) {
            matches.push({
              file: relative(cwd, match[1]!),
              line: parseInt(match[2]!, 10),
              content: match[3]!,
            });
          }
        }
        return {
          matches,
          ...(truncate ? { truncate: true, totalMatches: lines.length } : {}),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { error: `Failed to execute command: ${message}` };
      }
    },
  });
};
