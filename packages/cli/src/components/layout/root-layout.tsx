import { Outlet } from "react-router";
import { DialogProvider } from "../../providers/dialog/dialog-provider";
import { KeyboardProvider } from "../../providers/keyboard/keyboard-provider";
import { ThemeProvider } from "../../providers/theme/theme-provider";
import { ToastProvider } from "../../providers/toast/toast-provider";
import { App } from "./app";
import { ModeProvider } from "../../providers/mode/mode-provider";
import { ModelProvider } from "../../providers/model/model-provider";

export const RootLayout = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <KeyboardProvider>
          <DialogProvider>
            <ModeProvider>
              <ModelProvider>
                <App>
                  <Outlet />
                </App>
              </ModelProvider>
            </ModeProvider>
          </DialogProvider>
        </KeyboardProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};
