import { TextAttributes } from "@opentui/core";
import { useModel } from "../providers/model/model-context";
import { useMode } from "../providers/mode/mode-context";
import { Mode } from "@code-sama/database";
import { useTheme } from "../providers/theme/theme-context";

export const StatusBar = () => {
  const { model } = useModel();
  const { mode, setMode } = useMode();
  const { colors } = useTheme();
  return (
    <box flexDirection="row" gap={1}>
      <text fg={mode === Mode.PLAN ? colors.planMode : colors.primary}>
        {mode}
      </text>
      <text fg="gray" attributes={TextAttributes.DIM}>
        &gt;
      </text>
      <text>{model}</text>
    </box>
  );
};
