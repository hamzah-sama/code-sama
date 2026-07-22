import { useTheme } from "../../providers/theme/theme-context";

export const UserMessage = ({ message }: { message: string | null }) => {
  const { colors } = useTheme();
  return (
    <box width="100%" alignItems="center">
      <box borderColor={colors.primary} border={["left"]} width="100%">
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