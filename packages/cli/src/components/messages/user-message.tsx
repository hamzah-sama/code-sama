import { Mode } from "@code-sama/database";
import { useTheme } from "../../providers/theme/theme-context";

interface Props {
  message: string | null;
  mode: Mode;
}

export const UserMessage = ({ message, mode }: Props) => {
  const { colors } = useTheme();
  return (
    <box width="100%" alignItems="center">
      <box
        borderColor={mode === Mode.PLAN ? colors.planMode : colors.primary}
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
