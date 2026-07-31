import { Outlet } from "react-router";
import { DialogProvider } from "../../providers/dialog/dialog-provider";
import { ThemeProvider } from "../../providers/theme/theme-provider";
import { ToastProvider } from "../../providers/toast/toast-provider";
import { App } from "./app";
import { ModeProvider } from "../../providers/mode/mode-provider";
import { ModelProvider } from "../../providers/model/model-provider";
import { LayerProvider } from "../../providers/layer/layer-provider";

export const RootLayout = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <LayerProvider>
          <DialogProvider>
            <ModeProvider>
              <ModelProvider>
                <App>
                  <Outlet />
                </App>
              </ModelProvider>
            </ModeProvider>
          </DialogProvider>
        </LayerProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};
