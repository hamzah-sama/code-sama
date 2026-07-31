import { useTerminalDimensions } from "@opentui/react";
import type { ToastOptions, ToastVariant } from "./type";
import { useTheme } from "../theme/theme-context";

interface Props {
  toast: ToastOptions | null;
}

export const Toast = ({ toast }: Props) => {
  const { width } = useTerminalDimensions();
  const { colors } = useTheme();

  if (!toast) return null;

  const variantColor: Record<ToastVariant, string> = {
    success: colors.success,
    error: colors.error,
    info: colors.info,
  };

  const borderColor = toast.variant
    ? variantColor[toast.variant]
    : variantColor.info;

  return (
    <box
      position="absolute"
      width={Math.max(1, Math.min(60, width - 6))}
      top={2}
      right={2}
      justifyContent="center"
      alignItems="flex-start"
      padding={1}
      borderColor={borderColor}
      border={["right", "left"]}
      backgroundColor={colors.surface}
    >
      <text width="100%" wrapMode="word" fg={colors.primary}>
        {toast.message}
      </text>
    </box>
  );
};
