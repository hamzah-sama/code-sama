import "opentui-spinner/react";
import { useTheme } from "../providers/theme/theme-context";
import { Mode, type ModeType } from "@code-sama/shared";
import { useMode } from "../providers/mode/mode-context";

export const Spinner = () => {
  const { colors } = useTheme();
  const { mode } = useMode();

  const activeColor = mode === Mode.plan ? colors.planMode : colors.primary;
  return <spinner name="aesthetic" color={activeColor} />;
};
