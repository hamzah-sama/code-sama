import "opentui-spinner/react";
import { useTheme } from "../providers/theme/theme-context";

export const Spinner = () => {
  const { colors } = useTheme();
  return <spinner name="aesthetic" color={colors.primary} />;
};