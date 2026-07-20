import { StatusBar } from "./status-bar";
import { textAreaKeyBindings } from "./key-bindings";
import { CommandMenu } from "./command-menu";
import { useRenderer } from "@opentui/react";
import { useEffect, useRef } from "react";
import type { TextareaRenderable } from "@opentui/core";
import { useCommandMenu } from "./command-menu/use-command-menu";
import type { Command } from "./command-menu/types";
import { useToast } from "../providers/toast/toast-context";
import { useDialog } from "../providers/dialog/dialog-context";
import { useTheme } from "../providers/theme/theme-context";
import { useKeyboardLayer } from "../providers/keyboard/keyboard-context";

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

  const toast = useToast();
  const dialog = useDialog();
  const { colors } = useTheme();
  const {isTopLayer, setResponder} = useKeyboardLayer();


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
        toast,
        dialog,
      });
    } else {
      textArea.insertText(command.value + " ");
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

   useEffect(() => {
    setResponder("base", () => {
      if (disabled) return false;
      const textArea = textAreaRef.current;
      if (textArea && textArea.plainText.length > 0) {
        textArea.setText("");
        return true;
      }
      return false;
    });
    return () => setResponder("base", null);
  }, [disabled, setResponder]);

  return (
    <box border={["left"]} borderColor={colors.primary}>
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
          <box
            position="absolute"
            zIndex={10}
            bottom="100%"
            left={0}
            width="100%"
            backgroundColor={colors.surface}
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
          focused={!disabled && !isTopLayer('dialog')}
          placeholder="Ask anything..."
          keyBindings={textAreaKeyBindings}
          onContentChange={handleTextAreaContentChange}
          ref={textAreaRef}
        />
        <StatusBar />
      </box>
    </box>
  );
};
