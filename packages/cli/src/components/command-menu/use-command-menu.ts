import type { ScrollBoxRenderable } from "@opentui/core";
import { useRef, useState } from "react";
import { getCommands } from "./get-command";
import type { Command } from "./types";
import { useKeyboard } from "@opentui/react";

type UseCommandMenuReturn = {
  showCommandMenu: boolean;
  selectCommand: (index: number) => Command | undefined;
  selectedIndex: number;
  handleContentChange: (text: string) => void;
  commandQuery: string;
  scrollRef: React.RefObject<ScrollBoxRenderable | null>;
};

export const useCommandMenu = (): UseCommandMenuReturn => {
  const [textValue, setTextValue] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCommandMenu, setShowCommandMenu] = useState(false);

  const scrollRef = useRef<ScrollBoxRenderable | null>(null);

  const commandQuery =
    showCommandMenu && textValue.startsWith("/") ? textValue.slice(1) : "";

  const commands = getCommands(commandQuery);

  const handleContentChange = (text: string) => {
    setTextValue(text);
    setSelectedIndex(0);

    const scrollBox = scrollRef.current;
    if (scrollBox) {
      scrollBox.scrollTo(0);
    }

    const prefix = text.startsWith("/") ? text.slice(1) : null;

    if (prefix !== null && !prefix.includes(" ")) {
      setShowCommandMenu(true);
    } else {
      setShowCommandMenu(false);
    }
  };

  const selectCommand = (index: number): Command | undefined => {
    const command = commands[index];
    if (command) {
      setShowCommandMenu(false);
    }
    return command;
  };

  useKeyboard((key) => {
    if (!showCommandMenu) return;
    if (key.name === "escape") {
      key.preventDefault();
      setShowCommandMenu(false);
    }
    if (key.name === "up") {
      key.preventDefault();
      setSelectedIndex((index: number) => {
        const newIndex = Math.max(index - 1, 0);
        const scrollBox = scrollRef.current;
        if (scrollBox && newIndex < scrollBox.scrollTop) {
          scrollBox.scrollTo(newIndex);
        }
        return newIndex;
      });
    }
    if (key.name === "down") {
      key.preventDefault();
      setSelectedIndex((index: number) => {
        if (commands.length === 0) return 0;
        const newIndex = Math.min(index + 1, commands.length - 1);
        const scrollBox = scrollRef.current;
        if (scrollBox) {
          const viewportHeight = scrollBox.viewport.height;
          const visibleEnd = scrollBox.scrollTop + viewportHeight - 1;
          if (newIndex > visibleEnd) {
            scrollBox.scrollTo(newIndex - viewportHeight + 1);
          }
        }
        return newIndex;
      });
    }
  });

  return {
    showCommandMenu,
    selectCommand,
    selectedIndex,
    handleContentChange,
    commandQuery,
    scrollRef,
  };
};
