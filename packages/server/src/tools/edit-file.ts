import { tool } from "ai";
import { z } from "zod";
import { readFile, writeFile } from "fs/promises";
import { resolve, relative, normalize } from "path";

export const createEditFileTool = (cwd: string) => {
  return tool({
    description:
      "Make a targeted edit to a file by replacing an exact string match. The oldstring must appear exactly once in the file (forsafety). Use this for surgical edits instead of rewriting entire files",
    inputSchema: z.object({
      path: z.string().describe("Relative path to the file to edit"),
      oldString: z
        .string()
        .describe(
          "The exact text to find and replace (must be unique in the file)",
        ),
      newString: z.string().describe("The text to replace it with"),
    }),
    execute: async ({ path, oldString, newString }) => {
      const resolvedPath = normalize(resolve(cwd, path));
      const normalizedCwd = normalize(cwd);

      if (!resolvedPath.startsWith(normalizedCwd)) {
        return { error: "Path is outside of the project directory" };
      }

      try {
        const content = await readFile(resolvedPath, "utf-8");
        const occurences = content.split(oldString).length - 1;
        if (occurences === 0) {
          return { error: "oldString not found in file" };
        }

        if (occurences > 1) {
          return {
            error: `oldString is ambigious - found ${occurences} matches. Provide more surrounding context to make it unique.`,
          };
        }

        const updated = content.replace(oldString, () => newString);

        await writeFile(resolvedPath, updated, "utf8");

        return {
          success: true as const,
          path: relative(cwd, resolvedPath),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { error: `Failed to edit file: ${message}` };
      }
    },
  });
};
