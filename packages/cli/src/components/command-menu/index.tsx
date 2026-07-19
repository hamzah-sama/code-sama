import { ScrollBoxRenderable, TextAttributes } from "@opentui/core";
import { commandList } from "./command-list";
import { getCommands } from "./get-command";
import type {RefObject} from 'react';

const MAX_VIEWABLE_COMMANDS = 6;

const COMMAND_COL_WIDTH =
  Math.max(...commandList.map((command) => command.name.length)) + 4;

interface Props {
  query: string;
  selectedIndex: number;
  scrollRef: RefObject<ScrollBoxRenderable | null>;
}
export const CommandMenu = ({ query, selectedIndex, scrollRef }: Props) => {
  const commands = getCommands(query);
  const visibleHeight = Math.min(commands.length, MAX_VIEWABLE_COMMANDS);

  if (commands.length === 0) {
    return (
      <box paddingX={1}>
        <text attributes={TextAttributes.DIM}>No matching commands</text>
      </box>
    );
  }

  return (
    <scrollbox height={visibleHeight} ref={scrollRef}>
      {commands.map((command, index) => {
        const isSelected = index === selectedIndex;
        return (
          <box
            key={command.value}
            flexDirection="row"
            gap={1}
            paddingX={1}
            height={1}
            overflow="hidden"
            backgroundColor={isSelected ? "#89B4fa" : undefined}
          >
            <box width={COMMAND_COL_WIDTH} flexShrink={0}>
              <text fg={isSelected ? "black" : "white"} selectable={false}>
                /{command.name}
              </text>
            </box>
            <box flexShrink={1} flexGrow={1} overflow="hidden">
              <text fg={isSelected ? "black" : "gray"} selectable={false}>
                {command.description}
              </text>
            </box>
          </box>
        );
      })}
    </scrollbox>
  );
};
