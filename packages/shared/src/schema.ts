import z from "zod";
import { tool } from "ai";

export const Mode = {
  build: "BUILD",
  plan: "PLAN",
} as const;

export const modeSchema = z.enum([Mode.build, Mode.plan]);

export type ModeType = (typeof Mode)[keyof typeof Mode];

export const toolsInputSchema = {
  readFile: z.object({
    path: z.string().describe("Relative path of the file to read").default("."),
  }),
  writeFile: z.object({
    path: z.string().describe("Relative path to write"),
    content: z.string().describe("File contents"),
  }),
  editFile: z.object({
    path: z.string().describe("Relative path to edit"),
    oldString: z.string().describe("Exact text to replace; must be unique"),
    newString: z.string().describe("Replacement text"),
  }),
  listDirectory: z.object({
    path: z.string().describe("Relative directory path to list").default("."),
  }),
  bash: z.object({
    command: z.string().describe("The shell command to execute"),
    description: z
      .string()
      .describe("Short description of what the command does")
      .optional(),
    timeOut: z.number().describe("Timeout in milliseconds").optional(),
  }),
  glob: z.object({
    pattern: z.string().describe("Glob patterns to match files"),
    path: z.string().describe("Directory to search from").default("."),
  }),
  grep: z.object({
    pattern: z.string().describe("Regex pattern to search for"),
    path: z.string().describe("Directory path to search from").default("."),
    include: z
      .string()
      .optional()
      .describe("Optional glob for files to include"),
  }),
} as const;

export const readOnlyTools = {
  readFile: tool({
    description: "Read a file from the current project directory",
    inputSchema: toolsInputSchema.readFile,
  }),
  grep: tool({
    description:
      "Search file contents with a regular expression under the current project directory",
    inputSchema: toolsInputSchema.grep,
  }),
  glob: tool({
    description:
      "Find files matching a glob pattern under the current project directory",
    inputSchema: toolsInputSchema.glob,
  }),
  listDirectory: tool({
    description:
      "List entries in a directory under the current project directory",
    inputSchema: toolsInputSchema.listDirectory,
  }),
} as const;

const buildTools = {
  ...readOnlyTools,
  writeFile: tool({
    description: "Create or overwrite file under the current project directory",
    inputSchema: toolsInputSchema.writeFile,
  }),
  editFile: tool({
    description:
      "Replace exact text in a file under the current project directory",
    inputSchema: toolsInputSchema.editFile,
  }),
  bash: tool({
    description: "Run a sheel command in the current project directory",
    inputSchema: toolsInputSchema.bash,
  }),
} as const;

export type AgentTools = typeof buildTools;

export const getTools = (modeType: ModeType) => {
  return modeType === Mode.plan ? readOnlyTools : buildTools;
};
