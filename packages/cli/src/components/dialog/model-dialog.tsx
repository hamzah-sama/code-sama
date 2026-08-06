import { DialogSearchList } from "./dialog-search-list";
import { useCallback } from "react";
import { useDialog } from "../../providers/dialog/dialog-context";
import type { SupportedChatModelName } from "@code-sama/shared";

interface Props {
  currentModel: SupportedChatModelName;
  models: SupportedChatModelName[];
  onSelectModel: (model: SupportedChatModelName) => void;
}

export const ModelDialog = ({ currentModel, onSelectModel, models }: Props) => {
  const { close } = useDialog();

  const handleSelect = useCallback((selectedModel: SupportedChatModelName) => {
    onSelectModel(selectedModel);
    close();
  }, []);

  return (
    <DialogSearchList
      items={models}
      placeholder="Select model..."
      emptyText="No matching models"
      getKey={(item) => item}
      filterFn={(item, query) =>
        item.toLowerCase().includes(query.toLowerCase())
      }
      renderItem={(item, isSelected) => (
        <>
          <text selectable={false} fg={isSelected ? "black" : "white"}>
            {item === currentModel
              ? "\u0020\u2022\u0020"
              : "\u0020\u0020\u0020"}
            {item}
          </text>
          <box flexGrow={1} />
        </>
      )}
      onSelect={handleSelect}
    />
  );
};
