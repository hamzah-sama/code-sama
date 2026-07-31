import type { ScrollBoxRenderable } from "@opentui/core";
import { useRef, useState } from "react";
import { useCommandNavigation } from "./use-command-navigations";
import type { Command } from "../types";
import { getCommands } from "../get-command";

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

  useCommandNavigation({
    showCommandMenu,
    setShowCommandMenu,
    setSelectedIndex,
    scrollRef,
    commands,
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
