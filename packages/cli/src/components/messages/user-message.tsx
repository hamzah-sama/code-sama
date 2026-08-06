import { Mode, type ModeType } from "@code-sama/shared";
import { useTheme } from "../../providers/theme/theme-context";

interface Props {
  message: string | null;
  mode: ModeType;
}

export const UserMessage = ({ message, mode }: Props) => {
  const { colors } = useTheme();
  return (
    <box width="100%" alignItems="center">
      <box
        borderColor={mode === Mode.plan ? colors.planMode : colors.primary}
        border={["left"]}
        width="100%"
      >
        <box
          backgroundColor={colors.surface}
          paddingX={2}
          paddingY={1}
          width="100%"
          justifyContent="center"
        >
          <text>{message}</text>
        </box>
      </box>
    </box>
  );
};
