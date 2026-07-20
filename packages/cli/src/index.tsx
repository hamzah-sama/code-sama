import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { Header } from "./components/header";
import { InputBar } from "./components/input-bar";
import { ToastProvider } from "./providers/toast/toast-provider";
import { ThemeProvider } from "./providers/theme/theme-provider";
import { DialogProvider } from "./providers/dialog/dialog-provider";
import { KeyboardProvider } from "./providers/keyboard/keyboard-provider";

function App() {
  return (
    <ThemeProvider>
      <KeyboardProvider>
        <DialogProvider>
          <ToastProvider>
            <box
              alignItems="center"
              justifyContent="center"
              backgroundColor="#0d0d12"
              height="100%"
              width="100%"
              gap={2}
            >
              <Header />
              <box width="100%" maxWidth={78} paddingX={2}>
                <InputBar onSubmit={() => {}} />
              </box>
            </box>
          </ToastProvider>
        </DialogProvider>
      </KeyboardProvider>
    </ThemeProvider>
  );
}

const renderer = await createCliRenderer({
  exitOnCtrlC: false,
});
createRoot(renderer).render(<App />);
