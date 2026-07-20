import { useCallback, useEffect, useRef } from "react";
import { useDialog } from "../../providers/dialog/dialog-context";
import { useTheme } from "../../providers/theme/theme-context";
import { THEMES, type Theme } from "../../providers/theme/theme-list";
import { DialogSearchList } from "./dialog-search-list";

export const ThemeDialog = () => {
  const { currentTheme, setTheme } = useTheme();
  const dialog = useDialog();

  const originalThemeRef = useRef(currentTheme);
  const confirmedSelectedRef = useRef(false);

  const handleSelect = useCallback(
    (theme: Theme) => {
      setTheme(theme);
      confirmedSelectedRef.current = true;
      dialog.close();
    },
    [setTheme, dialog],
  );

  const handleHighlight = useCallback(
    (theme: Theme) => {
      setTheme(theme);
    },
    [setTheme],
  );

  useEffect(() => {
    return () => {
      if (!confirmedSelectedRef.current) {
        setTheme(originalThemeRef.current);
      }
    };
  }, [setTheme]);

  return (
    <DialogSearchList
      items={THEMES}
      placeholder="Select Theme..."
      emptyText="No matching items"
      getKey={(item) => item.name}
      filterFn={(item, query) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      }
      renderItem={(theme, isSelected) => (
        <text selectable={false} fg={isSelected ? "black" : "white"}>
          {theme.name === originalThemeRef.current.name
            ? "\u0020\u2022\u0020"
            : "\u0020\u0020\u0020"}
          {theme.name}
        </text>
      )}
      onSelect={handleSelect}
      onHighlight={handleHighlight}
    />
  );
};
