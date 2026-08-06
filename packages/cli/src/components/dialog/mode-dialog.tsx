import { DialogSearchList } from "./dialog-search-list";
import { useCallback } from "react";
import { useDialog } from "../../providers/dialog/dialog-context";
import { type ModeType, Mode } from "@code-sama/shared";

interface Props {
  currentMode: ModeType;
  onSelectMode: (mode: ModeType) => void;
}

export const ModeDialog = ({ currentMode, onSelectMode }: Props) => {
  const { close } = useDialog();

  const availableModes: ModeType[] = [Mode.build, Mode.plan];
  const getModeLabel = (mode: ModeType) => {
    return mode === "PLAN" ? "Plan" : "Build";
  };

  const handleSelect = useCallback((selectedMode: ModeType) => {
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
