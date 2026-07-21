import { Outlet } from "react-router";
import { DialogProvider } from "../../providers/dialog/dialog-provider";
import { KeyboardProvider } from "../../providers/keyboard/keyboard-provider";
import { ThemeProvider } from "../../providers/theme/theme-provider";
import { ToastProvider } from "../../providers/toast/toast-provider";
import { App } from "./app";

export const RootLayout = () => {
  return (
    <ThemeProvider>
      <KeyboardProvider>
        <DialogProvider>
          <ToastProvider>
            <App>
              <Outlet />
            </App>
          </ToastProvider>
        </DialogProvider>
      </KeyboardProvider>
    </ThemeProvider>
  );
};
