import { tool } from "ai";
import { z } from "zod";
import { readFile } from "fs/promises";
import { resolve, relative, dirname } from "path";

const MAX_FILE_SIZE = 10_000;

export const createReadFileTool = (cwd: string) => {
  return tool({
    description:
      "Read the contents of a file in the project. Returns the file text, truncate if very large.",
    inputSchema: z.object({
      path: z.string().describe("Relative path to the file to read"),
    }),
    execute: async ({ path }) => {
      const resolvedPath = resolve(cwd, path);
      const rel = relative(cwd, resolvedPath);

      if (
        rel.startsWith("..") ||
        (resolve(resolvedPath) !== resolvedPath && rel.startsWith(".."))
      ) {
        return { error: "Path is outside of the project directory" };
      }
      if (!resolvedPath.startsWith(cwd)) {
        return { error: "Path is outside of the project directory" };
      }

      try {
        const content = await readFile(resolvedPath, "utf-8");
        if (content.length > MAX_FILE_SIZE) {
          return {
            content: content.slice(0, MAX_FILE_SIZE),
            truncated: true,
            totalLength: content.length,
          };
        }

        return { content };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { error: `Failed to read file: ${message}` };
      }
    },
  });
};
