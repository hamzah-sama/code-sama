import { tool } from "ai";
import { z } from "zod";
import { resolve, relative } from "path";

const MAX_RESULT = 200;

export const createGlobTool = (cwd: string) => {
  return tool({
    description:
      "Find files matching a glob pattern. Return file paths relative to the project root. Skips node_modules and hidden directory.",
    inputSchema: z.object({
      pattern: z
        .string()
        .describe("Glob pattern to match (e.g. '**/&.ts', 'src/**/*.tsx')"),
      path: z
        .string()
        .describe("Relative directory to search in (defaults to  project root)")
        .default("."),
    }),
    execute: async ({ path, pattern }) => {
      const resolvedPath = resolve(cwd, path);

      if (!resolvedPath.startsWith(cwd)) {
        return { error: "Path is outside of the project directory" };
      }

      try {
        const glob = new Bun.Glob(pattern);
        const files: string[] = [];
        let truncate = false;

        for await (const match of glob.scan({
          cwd: resolvedPath,
          dot: false,
          onlyFiles: true,
        })) {
          if (match.includes("node_modules")) continue;
          if (files.length >= MAX_RESULT) {
            truncate = true;
            break;
          }

          const absoluteMatch = resolve(cwd, match);
          files.push(relative(resolvedPath, absoluteMatch));
        }
        files.sort();
        return {
          files,
          ...(truncate ? { truncate: true } : {}),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { error: `Failed to execute command: ${message}` };
      }
    },
  });
};
