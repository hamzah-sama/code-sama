import { StatusBar } from "./status-bar";
import { CommandMenu } from "./../command-menu";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ScrollBoxRenderable, TextareaRenderable } from "@opentui/core";
import { useTheme } from "../../providers/theme/theme-context";
import { useMode } from "../../providers/mode/mode-context";
import { Mode } from "@code-sama/database";
import { textAreaKeyBindings } from "../key-bindings";
import { useLayer } from "../../providers/layer/layer-context";
import { useCommandMenu } from "../command-menu/hooks/use-command-menu";
import { useHandleCommand } from "../command-menu/hooks/use-handle-command";
import {
  findActiveMention,
  type MentionMatch,
} from "../file-mention/find-active-mention";
import type { MentionCandidate } from "../file-mention/types";
import { getMentionCandidates } from "../file-mention/get-mention-candidates";
import { useKeyboard } from "@opentui/react";
import { FileMention } from "../file-mention";
import { useFileMention } from "../file-mention/use-file-mention";

interface Props {
  onSubmit: (text: string) => void;
  sessionId?: string;
}

export const InputBar = ({ onSubmit, sessionId }: Props) => {
  const onSubmitRef = useRef<() => void>(() => {});
  const textAreaRef = useRef<TextareaRenderable>(null);
  const mentionScrollRef = useRef<ScrollBoxRenderable>(null);

  const {
    showCommandMenu,
    selectCommand,
    selectedIndex,
    handleContentChange,
    commandQuery,
    scrollRef,
  } = useCommandMenu();

  const {
    syncMentionMenu,
    showMentionMenu,
    handleMentionExecute,
    closeMentionMenu,
    activeMention,
    setMentionCandidates,
    setMentionSelectedIndex,
    mentionCandidates,
    mentionSelectedIndex,
  } = useFileMention({ mentionScrollRef, textAreaRef });

  const { mode } = useMode();
  const { colors } = useTheme();
  const { isTopLayer, setResponder } = useLayer();

  const handleTextAreaContentChange = () => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    const text = textArea.plainText;

    handleContentChange(text);
    syncMentionMenu(text, textArea.cursorOffset);
  };

  const handleTextareaCursorChange = ()=>{
    const textArea = textAreaRef.current;
    if (!textArea) return;
    syncMentionMenu(textArea.plainText, textArea.cursorOffset);
  }
  useEffect(() => {
    if (!activeMention) {
      setMentionCandidates([]);
      setMentionSelectedIndex(0);
      mentionScrollRef.current?.scrollTo(0);
      return;
    }

    let ignore = false;

    setMentionCandidates([]);
    setMentionSelectedIndex(0);
    mentionScrollRef.current?.scrollTo(0);

    const loadCandidates = async () => {
      const nextCandidates = await getMentionCandidates(activeMention.query);
      if (ignore) return;

      setMentionCandidates(nextCandidates);
      setMentionSelectedIndex((currentIndex) => {
        if (nextCandidates.length === 0) return 0;
        return Math.min(currentIndex, nextCandidates.length - 1);
      });
    };

    void loadCandidates();
    return () => {
      ignore = true;
    };
  }, [activeMention, setMentionCandidates, setMentionSelectedIndex]);

  const handleCommand = useHandleCommand({
    textAreaRef,
    sessionId,
  });

  const handleSubmit = () => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    const text = textArea.plainText.trim();
    if (text.length === 0) return;

    onSubmit(text);

    textArea.setText("");
    closeMentionMenu()
  };

  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    textArea.onSubmit = () => {
      onSubmitRef.current();
    };
  }, []);

  onSubmitRef.current = () => {
    if (showCommandMenu) {
      const command = selectCommand(selectedIndex);
      handleCommand(command);
      return;
    }

    if (showMentionMenu) {
      const candidate = mentionCandidates[mentionSelectedIndex];
      if (candidate) {
        handleMentionExecute(mentionSelectedIndex);
        return;
      }
    }

    handleSubmit();
  };

  // register base layer responder on initial mount
  useEffect(() => {
    setResponder("base", () => {
      const textArea = textAreaRef.current;
      if (textArea && textArea.plainText.length > 0) {
        textArea.setText("");
        return true;
      }
      return false;
    });
    return () => setResponder("base", null);
  }, [setResponder]);

  return (
    <box
      border={["left"]}
      borderColor={mode === Mode.BUILD ? colors.primary : colors.planMode}
    >
      <box
        position="relative"
        justifyContent="center"
        width="100%"
        paddingX={2}
        paddingY={1}
        backgroundColor={colors.surface}
        gap={1}
      >
        {showCommandMenu && (
          <CommandMenu
            query={commandQuery}
            selectedIndex={selectedIndex}
            scrollRef={scrollRef}
          />
        )}
        {!showCommandMenu && showMentionMenu && (
          <FileMention
            candidates={mentionCandidates}
            selectedIndex={mentionSelectedIndex}
            scrollRef={mentionScrollRef}
          />
        )}
        <textarea
          focused={
            isTopLayer("base") || isTopLayer("command") || isTopLayer("mention")
          }
          placeholder="Ask anything..."
          keyBindings={textAreaKeyBindings}
          onContentChange={handleTextAreaContentChange}
          onCursorChange={handleTextareaCursorChange}
          ref={textAreaRef}
        />
        <StatusBar />
      </box>
    </box>
  );
};
