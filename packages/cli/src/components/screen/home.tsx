import { useNavigate } from "react-router";
import { Header } from "../header";
import { InputBar } from "../input-bar";
import { useCallback } from "react";

export const HomeScreen = () => {
  const navigate = useNavigate();
  const handleSubmit = useCallback(
    (text: string) => {
      navigate("/session/new", { state: { message: text } });
    },
    [navigate],
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
      <box width="100%" maxWidth={78} paddingX={2}>
        <InputBar onSubmit={handleSubmit} />
      </box>
    </box>
  );
};
