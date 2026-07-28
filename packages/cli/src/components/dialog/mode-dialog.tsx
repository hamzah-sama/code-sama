import { Mode } from "@code-sama/database";
import { DialogSearchList } from "./dialog-search-list";
import { useCallback } from "react";
import { useDialog } from "../../providers/dialog/dialog-context";

interface Props {
  currentMode: Mode;
  onSelectMode: (mode: Mode) => void;
}

export const ModeDialog = ({ currentMode, onSelectMode }: Props) => {
  const { close } = useDialog();

  const availableModes: Mode[] = [Mode.BUILD, Mode.PLAN];
  const getModeLabel = (mode: Mode) => {
    return mode === Mode.PLAN ? "Plan" : "Build";
  };

  const handleSelect = useCallback((selectedMode: Mode) => {
    onSelectMode(selectedMode);
    close();
  }, []);

  return (
    <DialogSearchList
      items={availableModes}
      placeholder="Select mode..."
      emptyText="No matching modes"
      getKey={(item) => item}
      filterFn={(item, query) =>
        getModeLabel(item).toLowerCase().includes(query.toLowerCase())
      }
      renderItem={(item, isSelected) => (
        <>
          <text selectable={false} fg={isSelected ? "black" : "white"}>
            {item === currentMode ? "\u0020\u2022\u0020" : "\u0020\u0020\u0020"}
            {getModeLabel(item)}
          </text>
          <box flexGrow={1} />
        </>
      )}
      onSelect={handleSelect}
    />
  );
};
