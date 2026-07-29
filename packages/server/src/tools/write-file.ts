import { tool } from "ai";
import { z } from "zod";
import { mkdir, writeFile } from "fs/promises";
import { resolve, relative, dirname, normalize } from "path";

export const createWriteFileTool = (cwd: string) => {
  return tool({
    description:
      "Create or overwrite a file in the project. Creates parent directories if they don't exist.",
    inputSchema: z.object({
      path: z.string().describe("Relative path to the file to write"),
      content: z.string().describe("The full content to write to the file"),
    }),
    execute: async ({ path, content }) => {
      const resolvedPath = normalize(resolve(cwd, path));
      const normalizedCwd = normalize(cwd);

      if (!resolvedPath.startsWith(normalizedCwd)) {
        return { error: "Path is outside of the project directory" };
      }

      try {
        await mkdir(dirname(resolvedPath), { recursive: true });
        await writeFile(resolvedPath, content, "utf8");

        return {
          success: true as const,
          path: relative(cwd, resolvedPath),
          bytesWritten: Buffer.byteLength(content, "utf-8"),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { error: `Failed to write file: ${message}` };
      }
    },
  });
};
