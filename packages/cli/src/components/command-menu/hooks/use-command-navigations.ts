import type { ScrollBoxRenderable } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import type { RefObject } from "react";
import type { Command } from "../types";

interface Props {
  showCommandMenu: boolean;
  setShowCommandMenu: (value: boolean) => void;
  setSelectedIndex: (index: number | ((index: number) => number)) => void;
  scrollRef: RefObject<ScrollBoxRenderable | null>;
  commands: Command[];
}

export const useCommandNavigation = ({
  showCommandMenu,
  setShowCommandMenu,
  setSelectedIndex,
  scrollRef,
  commands,
}: Props) => {
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
};
