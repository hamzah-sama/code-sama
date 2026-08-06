import {
  Mode,
  readOnlyTools,
  toolsInputSchema,
  type ModeType,
} from "@code-sama/shared";
import { stat } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";

const MAX_FILE_SIZE = 10_000;
const DEFAULT_TIMEOUT = 30_000;
const MAX_RESULTS = 200;
const MAX_MATCHES = 50;
const MAX_OUTPUT = 20_000;

const resolveInsideCwd = (path: string) => {
  const cwd = process.cwd();
  const resolvedPath = resolve(cwd, path);
  const relativePath = relative(cwd, resolvedPath);

  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error("path is outside the current working directory");
  }

  return { resolvedPath, cwd };
};

const truncate = (value: string, limit: number) => {
  return value.length > limit
    ? `${value.slice(0, limit)} \n... (truncated, ${value.length} total chars)`
    : value;
};

export const agentTools = async (
  toolName: string,
  input: unknown,
  modeType: ModeType,
) => {
  if (modeType === Mode.plan && !(toolName in readOnlyTools)) {
    throw new Error(`Tool ${toolName} is not available in plan mode`);
  }

  switch (toolName) {
    case "readFile": {
      const { path } = toolsInputSchema.readFile.parse(input);
      const { resolvedPath } = resolveInsideCwd(path);
      const content = await readFile(resolvedPath, "utf-8");
      return content.length > MAX_FILE_SIZE
        ? {
            content: content.slice(0, MAX_FILE_SIZE),
            truncated: true,
            totalLength: content.length,
          }
        : { content };
    }
    case "listDirectory": {
      const { path } = toolsInputSchema.listDirectory.parse(input);
      const { resolvedPath, cwd } = resolveInsideCwd(path);
      const results: { name: string; type: "file" | "directory" }[] = [];
      const entries = await readdir(resolvedPath);

      for (const entry of entries) {
        if (entry.startsWith(".") || entry === "node_modules") continue;
        const info = await stat(join(resolvedPath, entry));
        results.push({
          name: entry,
          type: info.isDirectory() ? "directory" : "file",
        });
      }

      results.sort((a, b) =>
        a.type !== b.type
          ? a.type === "directory"
            ? 1
            : -1
          : a.name.localeCompare(b.name),
      );

      return { path: relative(cwd, resolvedPath), results };
    }

    case "glob": {
      const { pattern, path } = toolsInputSchema.glob.parse(input);
      const { resolvedPath, cwd } = resolveInsideCwd(path);
      const glob = new Bun.Glob(pattern);
      const files: string[] = [];
      let truncated = false;

      for await (const match of glob.scan({
        cwd: resolvedPath,
        dot: false,
        onlyFiles: true,
      })) {
        if (match.includes("node_modules")) continue;
        if (files.length > MAX_RESULTS) {
          truncated = true;
          break;
        }
        files.push(relative(cwd, resolve(resolvedPath, match)));
      }

      files.sort();

      return { files, ...(truncated ? { truncated: true } : {}) };
    }

    case "grep": {
      const { pattern, path, include } = toolsInputSchema.grep.parse(input);
      const { resolvedPath, cwd } = resolveInsideCwd(path);

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

      const processGrep = Bun.spawn(["grep", ...args], {
        cwd,
        stdout: "pipe",
        stderr: "pipe",
      });

      const [stdout, stderr] = await Promise.all([
        new Response(processGrep.stdout).text(),
        new Response(processGrep.stderr).text(),
      ]);

      const exitCode = processGrep.exitCode;

      if (exitCode !== 0 && exitCode !== 1) {
        throw new Error(`Grep failed: ${stderr.trim()}`);
      }
      if (!stdout.trim()) return { matches: [], message: "no matches found" };

      const lines = stdout.trim().split("\n");
      const matches: { file: string; content: string; line: number }[] = [];
      let truncated = false;

      for (const line of lines) {
        if (matches.length > MAX_MATCHES) {
          truncated = true;
          break;
        }
        const match = line.match(/^(.+?):(\d+):(.*)$/);
        if (match) {
          matches.push({
            file: relative(cwd, match[1]!),
            content: match[3]!,
            line: Number(match[2]),
          });
        }
      }
      return {
        matches,
        ...(truncated ? { truncated: true, totalMatches: lines.length } : {}),
      };
    }

    case "writeFile": {
      const { path, content } = toolsInputSchema.writeFile.parse(input);
      const { resolvedPath, cwd } = resolveInsideCwd(path);
      await mkdir(resolvedPath, { recursive: true });
      await writeFile(resolvedPath, content, "utf-8");

      return {
        succes: true as const,
        path: relative(cwd, resolvedPath),
        bytesWritten: Buffer.byteLength(content, "utf-8"),
      };
    }
    case "editFile": {
      const { oldString, newString, path } =
        toolsInputSchema.editFile.parse(input);
      const { resolvedPath, cwd } = resolveInsideCwd(path);
      const content = await readFile(resolvedPath, "utf-8");

      const occurences = content.split(oldString).length - 1;
      if (occurences === 0) {
        throw new Error("Old string not found in a file");
      }
      if (occurences > 1) {
        throw new Error("Old string found multiple times in a file");
      }

      await writeFile(resolvedPath, content.replace(oldString, newString));
      return { succes: true as const, path: relative(cwd, resolvedPath) };
    }
    case "bash": {
      const { command, timeOut = DEFAULT_TIMEOUT } =
        toolsInputSchema.bash.parse(input);
      const processBash = Bun.spawn(["bash", "-c", command], {
        cwd: resolveInsideCwd("").resolvedPath,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, TERM: "dumb" },
      });

      const timer = setTimeout(() => processBash.kill(), timeOut);

      const [stdout, stderr] = await Promise.all([
        new Response(processBash.stdout).text(),
        new Response(processBash.stderr).text(),
      ]);

      const exitCode = processBash.exitCode;

      clearTimeout(timer);
      return {
        stdout: truncate(stdout, MAX_OUTPUT),
        stderr: truncate(stderr, MAX_OUTPUT),
        exitCode,
      };
    }
    default:
      throw new Error(`Unknown tool : ${toolName}`);
  }
};
