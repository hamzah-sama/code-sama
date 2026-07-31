import { type ScrollBoxRenderable } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useRef } from "react";
import { InputBar } from "../../input-bar";
import { SessionFooter } from "./session-footer";
import { ChatContainer } from "./chat-container";

interface Props {
  children?: React.ReactNode;
  onSubmit: (text: string) => void;
  loading: boolean;
  sessionId: string;
}

export const SessionWrapper = ({
  children,
  onSubmit,
  loading,
  sessionId,
}: Props) => {
  const scrollboxRef = useRef<ScrollBoxRenderable>(null);

  const handleSubmit = (text: string) => {
    scrollboxRef.current?.scrollTo(Infinity);
    onSubmit(text);
  };

  return (
    <box
      flexDirection="column"
      gap={1}
      flexGrow={1}
      width="100%"
      height="100%"
      paddingY={1}
      paddingX={2}
    >
      <ChatContainer scrollboxRef={scrollboxRef}>{children}</ChatContainer>

      <box flexShrink={0}>
        <InputBar
          onSubmit={handleSubmit}
          sessionId={sessionId}
        />
      </box>
      <SessionFooter loading={loading} />
    </box>
  );
};
