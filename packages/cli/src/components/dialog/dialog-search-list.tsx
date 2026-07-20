import {
  ScrollBoxRenderable,
  TextAttributes,
  type InputRenderable,
} from "@opentui/core";
import { useRef, useState } from "react";
import { useKeyboard } from "@opentui/react";
import { useTheme } from "../../providers/theme/theme-context";
import { useKeyboardLayer } from "../../providers/keyboard/keyboard-context";

interface Props<T> {
  placeholder: string;
  items: T[];
  filterFn: (item: T, query: string) => boolean;
  emptyText: string;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  getKey: (item: T) => string;
  onSelect: (item: T) => void;
  onHighlight?: (item: T) => void;
}

export const DialogSearchList = <T,>({
  placeholder,
  items,
  filterFn,
  emptyText,
  renderItem,
  getKey,
  onSelect,
  onHighlight,
}: Props<T>) => {
  const inputRef = useRef<InputRenderable>(null);
  const scrollRef = useRef<ScrollBoxRenderable>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const { colors } = useTheme();
  const { isTopLayer } = useKeyboardLayer();
  const MAX_VISIBLE_ITEMS = 8;

  const handleContentChange = () => {
    const text = inputRef.current?.value ?? "";
    setSearchValue(text);
    setSelectedIndex(0);
  };

  const filtered = searchValue
    ? items.filter((item) => filterFn(item, searchValue))
    : items;

  const visibleHeight = Math.min(filtered.length, MAX_VISIBLE_ITEMS);

  //Key handler
  useKeyboard((key) => {
    if (!isTopLayer("dialog")) return;

    if (key.name === "return" || key.name === "enter") {
      key.preventDefault();
      const item = filtered[selectedIndex];
      if (item) onSelect(item);
    } else if (key.name === "up") {
      key.preventDefault();
      setSelectedIndex((index) => {
        const newIndex = Math.max(index - 1, 0);
        const sb = scrollRef.current;
        if (sb && newIndex < sb.scrollTop) sb.scrollTo(newIndex);
        const item = filtered[newIndex];
        if (item && onHighlight) onHighlight(item);
        return newIndex;
      });
    } else if (key.name === "down") {
      key.preventDefault();
      setSelectedIndex((index) => {
        const newIndex = Math.min(index + 1, filtered.length - 1);
        const sb = scrollRef.current;
        if (sb) {
          const viewPortHeight = sb.viewport.height;
          const visibleEnd = sb.scrollTop + viewPortHeight - 1;
          if (newIndex > visibleEnd) sb.scrollTo(newIndex - viewPortHeight + 1);
        }
        const item = filtered[newIndex];
        if (item && onHighlight) onHighlight(item);
        return newIndex;
      });
    }
  });

  return (
    <box flexDirection="column" gap={1}>
      <input
        focused
        placeholder={placeholder}
        ref={inputRef}
        onContentChange={handleContentChange}
      />
      {filtered.length === 0 ? (
        <text attributes={TextAttributes.DIM}>{emptyText}</text>
      ) : (
        <scrollbox ref={scrollRef} height={visibleHeight}>
          {filtered.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <box
                key={getKey(item)}
                height={1}
                overflow="hidden"
                backgroundColor={isSelected ? colors.selection : undefined}
              >
                {renderItem(item, isSelected)}
              </box>
            );
          })}
        </scrollbox>
      )}
    </box>
  );
};