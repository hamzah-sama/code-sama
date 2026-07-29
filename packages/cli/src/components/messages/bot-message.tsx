import { Mode } from "@code-sama/database";
import { useTheme } from "../../providers/theme/theme-context";
import { Spinner } from "../spinner";
import { TextAttributes } from "@opentui/core";
import type { ClientMessagePart, ClientToolCallPart } from "../../hooks/types";

interface Props {
  parts: ClientMessagePart[];
  model: string;
  mode: Mode;
  duration?: string | null;
  streaming?: boolean;
  interrupted?: boolean;
}

const formatToolName = (name: string): string => {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
};

const formatToolArgs = (tc: ClientToolCallPart): string => {
  return Object.values(tc.args).map(String).join(" ");
};

type PartGroup = {
  type: ClientMessagePart["type"];
  parts: ClientMessagePart[];
  key: string;
};

const groupConsecutiveParts = (parts: ClientMessagePart[]): PartGroup[] => {
  const groups: PartGroup[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    const lastGroup = groups.at(-1);

    if (lastGroup?.type === part.type) {
      lastGroup.parts.push(part);
    } else {
      const key =
        part.type === "tool-call"
          ? `group-tc-${part.id}`
          : `group-${part.type}-${i}`;

      groups.push({ type: part.type, parts: [part], key });
    }
  }
  return groups;
};

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
      {groupConsecutiveParts(parts).map((group) => (
        <box key={group.key} width="100%" paddingY={1}>
          {group.parts.map((part, i) => {
            if (part.type === "reasoning") {
              return (
                <box
                  key={`reasoning-${i}`}
                  border={["left"]}
                  borderColor={colors.thinkingBorder}
                  paddingX={2}
                  width="100%"
                >
                  <text attributes={TextAttributes.DIM}>
                    <em fg={colors.thinking}>Thinking : </em>
                    {part.text}
                  </text>
                </box>
              );
            }

            if (part.type === "tool-call") {
              return (
                <box
                  key={part.id}
                  border={["left"]}
                  borderColor={colors.thinkingBorder}
                  paddingX={2}
                  width="100%"
                >
                  <text attributes={TextAttributes.DIM}>
                    <em fg={colors.info}>{formatToolName(part.name)}:</em>
                    {formatToolArgs(part)}{" "}
                    {part.status === "calling" ? " ..." : ""}
                  </text>
                </box>
              );
            }

            if (part.type === "text") {
              return (
                <box key={`text-${i}`} paddingX={3} width="100%">
                  <text>{part.text}</text>
                </box>
              );
            }
            return null;
          })}
        </box>
      ))}

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
