import { Mode, type ModeType } from "@code-sama/shared";
import { useTheme } from "../../providers/theme/theme-context";
import { TextAttributes } from "@opentui/core";
import type { Message } from "../../hooks/types";
import prettyMs from "pretty-ms";

type ClientMessagePart = Message["parts"][0];
type ToolPart = Extract<
  ClientMessagePart,
  { type: `tool-${string}` | "dynamic-tool" }
>;

interface Props {
  parts: ClientMessagePart[];
  model: string;
  mode: ModeType;
  durationMs?: number;
  streaming?: boolean;
}

const formatToolName = (name: string): string => {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
};

const isToolParts = (part: ClientMessagePart): part is ToolPart =>
  part.type === "dynamic-tool" || part.type.startsWith("tool-");

const formatToolArgs = (tc: ToolPart): string => {
  if (!("input" in tc) || tc.input == null) return "";
  if (tc.input === "object") return String(tc.input);
  return Object.values(tc.input).map(String).join(" ");
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
      const key = isToolParts(part)
        ? `group-tc-${part.toolCallId}`
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
  durationMs,
  streaming = false,
}: Props) => {
  const { colors } = useTheme();
  const text = parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
  return (
    <box width="100%" alignItems="center">
      {groupConsecutiveParts(parts).map((group, i) => (
        <box key={group.key} width="100%" paddingTop={i === 0 ? 0 : 1}>
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
                    <em fg={colors.thinking}>Thinking: </em>
                    {part.text}
                  </text>
                </box>
              );
            }

            if (isToolParts(part)) {
              const toolName =
                part.type === "dynamic-tool"
                  ? part.toolName
                  : part.type.slice("tool-".length);
              return (
                <box
                  key={part.toolCallId}
                  border={["left"]}
                  borderColor={colors.thinkingBorder}
                  paddingX={2}
                  width="100%"
                >
                  <text attributes={TextAttributes.DIM}>
                    <em fg={colors.info}>{formatToolName(toolName)}:</em>
                    {formatToolArgs(part)}{" "}
                    {part.state !== "output-available" &&
                    part.state !== "output-error"
                      ? " ..."
                      : ""}
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

      <box paddingX={3} paddingY={1} gap={1} width="100%">
        <box flexDirection="row" gap={2}>
          <text fg={mode === Mode.plan ? colors.planMode : colors.primary}>
            ◉
          </text>
          <box flexDirection="row" gap={1}>
            <text>{mode === Mode.plan ? "Plan" : "Build"}</text>
            <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
              &gt;
            </text>

            <text attributes={TextAttributes.DIM}>{model}</text>

            {durationMs != null && (
              <>
                <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                  &gt;
                </text>
                <text attributes={TextAttributes.DIM}>
                  {prettyMs(durationMs)}
                </text>
              </>
            )}
          </box>
        </box>
      </box>
    </box>
  );
};
