import { tool } from "ai";
import { z } from "zod";
import { resolve, relative, join } from "path";
import { readdir, stat } from "fs/promises";

export const createListDirectoryTool = (cwd: string) => {
  return tool({
    description:
      "List files and directories in a project directory, Returns names with type indicator.",
    inputSchema: z.object({
      path: z
        .string()
        .describe(
          "Relative path to the directory to list (defaults to the project root)",
        )
        .default("."),
    }),
    execute: async ({ path }) => {
      const resolvedPath = resolve(cwd, path);

      if (!resolvedPath.startsWith(cwd)) {
        return { error: "Path is outside of the project directory" };
      }

      try {
        const entries = await readdir(resolvedPath);
        const results: { name: string; type: "file" | "directory" }[] = [];

        for (const entry of entries) {
          if (entry.startsWith(".") || entry === "node_modules") continue;
          try {
            const entryPath = join(resolvedPath, entry);

            const info = await stat(entryPath);

            results.push({
              name: entry,
              type: info.isDirectory() ? "directory" : "file",
            });
          } catch {
            // skip entries we can't stat
          }
        }

        results.sort((a, b) => {
          if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

        return {
          path: relative(cwd, resolvedPath) || ".",
          entries: results,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { error: `Failed to list directory: ${message}` };
      }
    },
  });
};
