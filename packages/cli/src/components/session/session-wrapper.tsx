import { TextAttributes, type ScrollBoxRenderable } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { InputBar } from "../input-bar";
import { Spinner } from "../spinner";
import { useRef } from "react";

interface Props {
  children?: React.ReactNode;
  inputDisabled?: boolean;
  onSubmit: (text: string) => void;
  loading?: boolean;
  interrupttible?: boolean;
}

export const SessionWrapper = ({
  children,
  inputDisabled = false,
  onSubmit,
  loading,
  interrupttible,
}: Props) => {
  const scrollboxRef = useRef<ScrollBoxRenderable>(null);

  useKeyboard((key) => {
    const scrollbox = scrollboxRef.current;

    if (!scrollbox) return;

    switch (key.name) {
      case "up":
        key.preventDefault();

        scrollbox.scrollBy({
          x: 0,
          y: -3,
        });
        break;

      case "down":
        key.preventDefault();

        scrollbox.scrollBy({
          x: 0,
          y: 3,
        });
        break;
    }
  });

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
      <scrollbox
        ref={scrollboxRef}
        flexGrow={1}
        width="100%"
        stickyScroll
        stickyStart="bottom"
      >
        <box>{children}</box>
      </scrollbox>

      <box flexShrink={0}>
        <InputBar
          onSubmit={onSubmit}
          disabled={inputDisabled}
          homeScreen={false}
        />
      </box>

      <box
        flexShrink={0}
        flexDirection="row"
        justifyContent="space-between"
        width="100%"
        height={1}
        gap={2}
        paddingLeft={1}
      >
        <box flexDirection="row" alignItems="center" gap={2}>
          {loading ? (
            <>
              <Spinner />
              {interrupttible && <text>Esc to interrupt</text>}
            </>
          ) : null}
        </box>

        <box flexDirection="row" gap={1} flexShrink={0} marginLeft="auto">
          <text>tab</text>
          <text attributes={TextAttributes.DIM}>modes</text>
        </box>
      </box>
    </box>
  );
};
