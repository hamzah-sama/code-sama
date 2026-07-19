import { StatusBar } from "./status-bar";
import { textAreaKeyBindings } from "./key-bindings";
import { CommandMenu } from "./command-menu";
import { useRenderer } from "@opentui/react";
import { useEffect, useRef } from "react";
import type { TextareaRenderable } from "@opentui/core";
import { useCommandMenu } from "./command-menu/use-command-menu";
import type { Command } from "./command-menu/types";

interface Props {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export const InputBar = ({ onSubmit, disabled = false }: Props) => {
  const renderer = useRenderer();
  const onSubmitRef = useRef<() => void>(() => {});
  const textAreaRef = useRef<TextareaRenderable>(null);

  const {
    showCommandMenu,
    selectCommand,
    selectedIndex,
    handleContentChange,
    commandQuery,
    scrollRef,
  } = useCommandMenu();

  const handleTextAreaContentChange = () => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    handleContentChange(textArea.plainText);
  };

  const handleCommand = (command: Command | undefined) => {
    const textArea = textAreaRef.current;
    if (!textArea || !command) return;

    textArea.setText("");

    if (command.action) {
      command.action({
        exit: () => renderer.destroy(),
      });
    } else {
      textArea.insertText(command.value + ' ');
    }
  };

  const handleSubmit = () => {
    if (disabled) return;

    const textArea = textAreaRef.current;
    if (!textArea) return;

    const text = textArea.plainText.trim();
    if (text.length === 0) return;

    onSubmit(text);

    textArea.setText("");
  };

  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    textArea.onSubmit = () => {
      onSubmitRef.current();
    };
  }, []);

  onSubmitRef.current = () => {
    if (disabled) return;

    if (showCommandMenu) {
      const command = selectCommand(selectedIndex);
      handleCommand(command);
    } else {
      handleSubmit();
    }
  };

  return (
    <box border={["left"]} borderColor="cyan">
      <box
        position="relative"
        justifyContent="center"
        width="100%"
        paddingX={2}
        paddingY={1}
        backgroundColor="#1a1a24"
        gap={1}
      >
        {showCommandMenu && (
          <box
            position="absolute"
            zIndex={10}
            bottom="100%"
            left={0}
            width="100%"
            backgroundColor="#1a1a24"
            paddingX={2}
          >
            <CommandMenu
              query={commandQuery}
              selectedIndex={selectedIndex}
              scrollRef={scrollRef}
            />
          </box>
        )}
        <textarea
          focused={!disabled}
          placeholder="Ask anything..."
          keyBindings={textAreaKeyBindings}
          onContentChange={handleTextAreaContentChange}
          ref={textAreaRef}
        />
        <StatusBar />
        <text>{showCommandMenu ? "true" : "false"}</text>
      </box>
    </box>
  );
};
