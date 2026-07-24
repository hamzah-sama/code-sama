import { Mode } from "@code-sama/database";
import { useTheme } from "../../providers/theme/theme-context";
import { Spinner } from "../spinner";
import { TextAttributes } from "@opentui/core";
import type { ClientMessagePart } from "../../hooks/types";

interface Props {
  parts: ClientMessagePart[];
  model: string;
  mode: Mode;
  duration?: string | null;
  streaming?: boolean;
  interrupted?: boolean;
}

export const BotMessage = ({
  parts,
  model,
  mode,
  duration,
  streaming = false,
  interrupted,
}: Props) => {
  const { colors } = useTheme();
  const text = parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
  return (
    <box width="100%" alignItems="center">
      <box paddingY={1} width="100%">
        <box paddingX={2} backgroundColor={colors.background}>
          {streaming && text.length === 0 ? <Spinner /> : <text>{text}</text>}
        </box>
      </box>

      <box paddingX={3} paddingBottom={1} gap={1} width="100%">
        <box flexDirection="row" gap={2}>
          <text
            fg={
              interrupted
                ? undefined
                : mode === Mode.PLAN
                  ? colors.planMode
                  : colors.primary
            }
            attributes={interrupted ? TextAttributes.DIM : 0}
          >
            ◉
          </text>
          <box flexDirection="row" gap={1}>
            <text attributes={interrupted ? TextAttributes.DIM : 0}>
              {mode === Mode.PLAN ? "Plan" : "Build"}
            </text>
            <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
              &gt;
            </text>

            <text attributes={TextAttributes.DIM}>{model}</text>

            {(interrupted || duration) && (
              <>
                <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                  &gt;
                </text>
                <text attributes={TextAttributes.DIM}>
                  {interrupted ? "interrupted" : duration}
                </text>
              </>
            )}
          </box>
        </box>
      </box>
    </box>
  );
};
