import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import type { DialogConfig } from "./type";
import { useTheme } from "../theme/theme-context";
import { RGBA, TextAttributes } from "@opentui/core";
import { useLayer } from "../layer/layer-context";

interface Props {
  close: () => void;
  currentDialog: DialogConfig | null;
}

export const Dialog = ({ close, currentDialog }: Props) => {
  const { isTopLayer } = useLayer();
  const { width, height } = useTerminalDimensions();
  const { colors } = useTheme();

  useKeyboard((key) => {
    if (!currentDialog || !isTopLayer("dialog")) return;
    if (key.name === "escape") {
      key.preventDefault();
      close();
    }
  });

  if (!currentDialog) return null;

  const { title, children } = currentDialog;
  return (
    <box
      position="absolute"
      left={0}
      top={0}
      zIndex={100}
      height={height}
      width={width}
      justifyContent="center"
      alignItems="center"
      backgroundColor={RGBA.fromInts(0, 0, 0, 150)}
    >
      <box
        flexDirection="column"
        gap={1}
        backgroundColor={colors.dialogSurface}
        paddingX={4}
        paddingY={1}
        width={Math.min(60, width - 4)}
        height="auto"
      >
        <box
          flexDirection="row"
          paddingBottom={1}
          justifyContent="space-between"
          alignItems="center"
        >
          <text attributes={TextAttributes.DIM}>{title}</text>
          <box flexDirection="row" gap={1}>
            <text attributes={TextAttributes.INVERSE}>ESC</text>
            <text attributes={TextAttributes.DIM}>close</text>
          </box>
        </box>
        <box flexGrow={1}>{children}</box>
      </box>
    </box>
  );
};
