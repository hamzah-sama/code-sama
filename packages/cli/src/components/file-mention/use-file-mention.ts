import { useCallback, useRef, useState, type RefObject } from "react";
import { useKeyboard } from "@opentui/react";
import type { ScrollBoxRenderable, TextareaRenderable } from "@opentui/core";
import { useLayer } from "../../providers/layer/layer-context";
import { findActiveMention, type MentionMatch } from "./find-active-mention";
import type { MentionCandidate } from "./types";

interface Props {
  mentionScrollRef: RefObject<ScrollBoxRenderable | null>;
  textAreaRef: RefObject<TextareaRenderable | null>;
}

export const useFileMention = ({ mentionScrollRef, textAreaRef }: Props) => {
  const activeMentionRef = useRef<MentionMatch | null>(null);
  const [activeMention, setActiveMention] = useState<MentionMatch | null>(null);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentionCandidates, setMentionCandidates] = useState<MentionCandidate[]>([]);

  const { push, pop, isTopLayer } = useLayer();

  const ensureMentionVisible = useCallback(
    (index: number) => {
      const scrollbox = mentionScrollRef.current;
      if (!scrollbox) return;

      const viewportHeight = Math.max(scrollbox.viewport.height, 1);
      const visibleStart = scrollbox.scrollTop;
      const visibleEnd = visibleStart + viewportHeight - 1;

      if (index < visibleStart) {
        scrollbox.scrollTo(index);
        return;
      }

      if (index > visibleEnd) {
        scrollbox.scrollTo(index - viewportHeight + 1);
      }
    },
    [mentionScrollRef],
  );

  const closeMentionMenu = useCallback(() => {
    activeMentionRef.current = null;
    setActiveMention(null);
    setMentionCandidates([]);
    setMentionSelectedIndex(0);
    mentionScrollRef.current?.scrollTo(0);
    pop("mention");
  }, [mentionScrollRef, pop]);

  const showMentionMenu = activeMention !== null;

  const syncMentionMenu = useCallback(
    (text: string, cursorOffset: number) => {
      const nextMention = findActiveMention(text, cursorOffset);
      const prevMention = activeMentionRef.current;
      const mentionChanged =
        prevMention?.start !== nextMention?.start ||
        prevMention?.end !== nextMention?.end ||
        prevMention?.query !== nextMention?.query;

      if (!nextMention) {
        if (prevMention) {
          closeMentionMenu();
        }
        return;
      }

      activeMentionRef.current = nextMention;
      setActiveMention(nextMention);

      if (!prevMention) {
        push("mention", () => {
          closeMentionMenu();
          return true;
        });
      }

      if (mentionChanged) {
        setMentionSelectedIndex(0);
        mentionScrollRef.current?.scrollTo(0);
      }
    },
    [closeMentionMenu, mentionScrollRef, push],
  );

  const handleMentionExecute = useCallback(
    (index: number) => {
      const textArea = textAreaRef.current;
      const mention = activeMentionRef.current;
      const candidate = mentionCandidates[index];
      if (!textArea || !mention || !candidate) return;

      const text = textArea.plainText;
      const insertion =
        candidate.kind === "directory" ? candidate.path : `${candidate.path} `;
      const nextText = `${text.slice(0, mention.start)}@${insertion}${text.slice(mention.end)}`;

      textArea.replaceText(nextText);
      textArea.cursorOffset = mention.start + insertion.length + 1;
      syncMentionMenu(nextText, textArea.cursorOffset);
    },
    [mentionCandidates, syncMentionMenu, textAreaRef],
  );

  useKeyboard((key) => {
    if (!showMentionMenu || !isTopLayer("mention")) return;

    if (key.name === "escape") {
      key.preventDefault();
      closeMentionMenu();
      return;
    }

    if (key.name === "up") {
      key.preventDefault();
      setMentionSelectedIndex((currentIndex) => {
        const nextIndex = Math.max(0, currentIndex - 1);
        ensureMentionVisible(nextIndex);
        return nextIndex;
      });
      return;
    }

    if (key.name === "down") {
      key.preventDefault();
      setMentionSelectedIndex((currentIndex) => {
        if (mentionCandidates.length === 0) {
          return 0;
        }

        const nextIndex = Math.min(
          mentionCandidates.length - 1,
          currentIndex + 1,
        );
        ensureMentionVisible(nextIndex);
        return nextIndex;
      });
    }
  });

  return {
    activeMention,
    closeMentionMenu,
    handleMentionExecute,
    mentionCandidates,
    mentionSelectedIndex,
    setMentionCandidates,
    setMentionSelectedIndex,
    showMentionMenu,
    syncMentionMenu,
  };
};
