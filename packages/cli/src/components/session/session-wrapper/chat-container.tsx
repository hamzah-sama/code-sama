import type { ScrollBoxRenderable } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { type RefObject } from "react";
import { useLayer } from "../../../providers/layer/layer-context";

interface Props {
  children: React.ReactNode;
  scrollboxRef: RefObject<ScrollBoxRenderable | null>;
}

export const ChatContainer = ({ children, scrollboxRef }: Props) => {
  const { isTopLayer } = useLayer();
  useKeyboard((key) => {
    const scrollbox = scrollboxRef.current;
    if (!isTopLayer("base")) return;

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
    <scrollbox
      ref={scrollboxRef}
      flexGrow={1}
      width="100%"
      stickyScroll
      stickyStart="bottom"
    >
      <box>{children}</box>
    </scrollbox>
  );
};
