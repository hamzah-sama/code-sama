import { useCallback, useState, type ReactNode } from "react";
import { DialogContext } from "./dialog-context";
import { useKeyboardLayer } from "../keyboard/keyboard-context";
import type { DialogConfig } from "./type";
import { Dialog } from "./dialog";

interface Props {
  children: ReactNode;
}

export const DialogProvider = ({ children }: Props) => {
  const { push, pop } = useKeyboardLayer();

  const [currentDialog, setCurrentDialog] = useState<DialogConfig | null>(null);

  const close = useCallback(() => {
    setCurrentDialog(null);
    pop("dialog");
  }, [pop]);

  const open = useCallback(
    (config: DialogConfig) => {
      setCurrentDialog(config);
      push("dialog", () => {
        close();
        return true;
      });
    },
    [close, push],
  );

  return (
    <DialogContext.Provider value={{ open, close }}>
      {children}
      <Dialog currentDialog={currentDialog} close={close} />
    </DialogContext.Provider>
  );
};
