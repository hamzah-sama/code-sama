import { TextAttributes } from "@opentui/core";
import { useTheme } from "../../providers/theme/theme-context";

export const ErrorMessage = ({ message }: { message: string }) => {
  const { colors } = useTheme();
  return (
    <box width="100%" alignItems="center">
      <box borderColor={colors.error} border={["left"]} width="100%">
        <box
          backgroundColor={colors.surface}
          paddingX={2}
          paddingY={1}
          width="100%"
          justifyContent="center"
        >
          <text attributes={TextAttributes.DIM}>{message}</text>
        </box>
      </box>
    </box>
  );
};