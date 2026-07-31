import { useCallback, type RefObject } from "react";
import { useNavigate } from "react-router";
import { useRenderer } from "@opentui/react";
import type { TextareaRenderable } from "@opentui/core";
import type { Command } from "../types";
import { useToast } from "../../../providers/toast/toast-context";
import { useMode } from "../../../providers/mode/mode-context";
import { useModel } from "../../../providers/model/model-context";
import { useDialog } from "../../../providers/dialog/dialog-context";

interface Props {
  textAreaRef: RefObject<TextareaRenderable | null>;
  sessionId?: string;
}

export function useHandleCommand({ textAreaRef, sessionId }: Props) {
  const toast = useToast();
  const { mode, setMode } = useMode();
  const { setModel, model } = useModel();
  const dialog = useDialog();
  const navigate = useNavigate();
  const renderer = useRenderer();

  return useCallback(
    (command: Command | undefined) => {
      const textArea = textAreaRef.current;
      if (!textArea || !command) return;

      textArea.setText("");

      if (command.action) {
        try {
          Promise.resolve(
            command.action({
              exit: () => renderer.destroy(),
              toast,
              dialog,
              navigate,
              mode,
              setModel,
              setMode,
              model,
              sessionId,
            }),
          ).catch((error) => {
            toast.show({ variant: "error", message: String(error) });
          });
        } catch (error) {
          toast.show({ variant: "error", message: String(error) });
        }
      } else {
        textArea.insertText(command.value + " ");
      }
    },
    [
      textAreaRef,
      renderer,
      toast,
      dialog,
      navigate,
      mode,
      setMode,
      model,
      setModel,
      sessionId,
    ],
  );
}
