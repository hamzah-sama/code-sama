import { TextAttributes, type ScrollBoxRenderable } from "@opentui/core";
import type { RefObject } from "react";
import { useTheme } from "../../providers/theme/theme-context";
import type { MentionCandidate } from "./types";

interface Props {
  selectedIndex: number;
  scrollRef: RefObject<ScrollBoxRenderable | null>;
  candidates: MentionCandidate[];
}

const MAX_VISIBLE_MENTIONS = 8;

export const FileMention = ({
  candidates,
  selectedIndex,
  scrollRef,
}: Props) => {
  const { colors } = useTheme();
  const visibleHeight = Math.min(candidates.length, MAX_VISIBLE_MENTIONS);

  return (
    <box
      position="absolute"
      zIndex={10}
      bottom="100%"
      left={0}
      width="100%"
      backgroundColor={colors.surface}
      paddingX={2}
    >
      {candidates.length === 0 ? (
        <box paddingX={1}>
          <text attributes={TextAttributes.DIM}>
            No matching files or folders
          </text>
        </box>
      ) : (
        <scrollbox height={visibleHeight} ref={scrollRef}>
          {candidates.map((candidate, index) => {
            const isSelected = index === selectedIndex;

            return (
              <box
                key={candidate.path}
                flexDirection="row"
                alignItems="center"
                gap={1}
                paddingX={1}
                height={1}
                overflow="hidden"
                backgroundColor={isSelected ? colors.selection : undefined}
              >
                <box overflow="hidden" flexGrow={1} flexShrink={1}>
                  <text selectable={false} fg={isSelected ? "black" : "white"}>
                    {candidate.path}
                  </text>
                </box>
                <box alignItems="flex-end" flexShrink={0}>
                  <text
                    selectable={false}
                    fg={isSelected ? "black" : "white"}
                    alignItems="flex-end"
                  >
                    {candidate.kind === "directory" ? "📁" : "📄"}
                  </text>
                </box>
              </box>
            );
          })}
        </scrollbox>
      )}
    </box>
  );
};
