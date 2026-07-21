import { useTheme } from "../../providers/theme/theme-context";

interface Props {
  content: string;
  model: string;
}

export const BotMessage = ({ content, model }: Props) => {
  const { colors } = useTheme();
  return (
    <box width="100%" alignItems="center">
      <box paddingY={1} width="100%">
        <box paddingX={2} backgroundColor={colors.surface}>
          <text>{content}</text>
        </box>
      </box>

      <box paddingX={3} paddingBottom={1} gap={1} width="100%">
        <box flexDirection="row" gap={2}>
          <text fg={colors.primary}>◉</text>
          <text>{model}</text>
        </box>
      </box>
    </box>
  );
};