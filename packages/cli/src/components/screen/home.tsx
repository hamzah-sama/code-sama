import { useNavigate } from "react-router";
import { Header } from "../header";
import { InputBar } from "../input-bar";
import { useCallback } from "react";
import { TextAttributes } from "@opentui/core";
import { useMode } from "../../providers/mode/mode-context";
import { useModel } from "../../providers/model/model-context";

export const HomeScreen = () => {
  const { mode } = useMode();
  const { model } = useModel();
  const navigate = useNavigate();
  const handleSubmit = useCallback(
    (text: string) => {
      navigate("/session/new", { state: { message: text, mode, model } });
    },
    [navigate, mode, model],
  );
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
      <box
        width="100%"
        maxWidth={78}
        paddingX={2}
        flexDirection="column"
        gap={1}
      >
        <InputBar onSubmit={handleSubmit} />
        <box flexDirection="row" gap={1} flexShrink={0} marginLeft="auto">
          <text>tab</text>
          <text attributes={TextAttributes.DIM}>modes</text>
        </box>
      </box>
    </box>
  );
};
