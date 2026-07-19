import type { Command } from "./types";
import { commandList } from "./command-list";

export const getCommands = (query: string): Command[] => {
  if (query.length === 0) return commandList;
  return commandList.filter((command) =>
    command.name.toLowerCase().startsWith(query.toLowerCase()),
  );
};
