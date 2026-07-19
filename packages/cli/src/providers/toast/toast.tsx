import { useTerminalDimensions } from "@opentui/react";
import type { ToastOptions, ToastVariant } from "./type";

interface Props {
  toast: ToastOptions | null;
}

export const Toast = ({ toast }: Props) => {
  const { width } = useTerminalDimensions();

  if (!toast) return null;

  const variantColor: Record<ToastVariant, string> = {
    success: "green",
    error: "red",
    info: "yellow",
  };

  const borderColor = toast.variant
    ? variantColor[toast.variant]
    : variantColor.info;

  return (
    <box
      position="absolute"
      width={Math.max(1, Math.min(30, width - 6))}
      top={2}
      right={2}
      justifyContent="center"
      alignItems="flex-start"
      padding={1}
      borderColor={borderColor}
      border={["right", "left"]}
    >
      <text width="100%" wrapMode="word" fg="#e1e1e1">
        {toast.message}
      </text>
    </box>
  );
};
