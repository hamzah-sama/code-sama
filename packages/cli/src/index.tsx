import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { Header } from "./components/header";
import { InputBar } from "./components/input-bar";

function App() {
  return (
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
  );
}

const renderer = await createCliRenderer({
  exitOnCtrlC: false,
});
createRoot(renderer).render(<App />);
