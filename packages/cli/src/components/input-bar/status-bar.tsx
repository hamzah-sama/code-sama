import { TextAttributes } from "@opentui/core";
import { useModel } from "../../providers/model/model-context";
import { useMode } from "../../providers/mode/mode-context";
import { Mode } from "@code-sama/shared";
import { useTheme } from "../../providers/theme/theme-context";
import { useLayer } from "../../providers/layer/layer-context";
import { useKeyboard } from "@opentui/react";

export const StatusBar = () => {
  const { model } = useModel();
  const { mode, toggleMode } = useMode();
  const { colors } = useTheme();
  const { isTopLayer } = useLayer();

  useKeyboard((key) => {
    if (!isTopLayer("base")) return;
    if (key.name === "tab") {
      key.preventDefault();
      toggleMode();
    }
  });

  return (
    <box flexDirection="row" gap={1}>
      <text fg={mode === Mode.plan ? colors.planMode : colors.primary}>
        {mode}
      </text>
      <text fg="gray" attributes={TextAttributes.DIM}>
        &gt;
      </text>
      <text>{model}</text>
    </box>
  );
};
