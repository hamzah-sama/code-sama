import { TextAttributes } from "@opentui/core";
import { InputBar } from "../input-bar";
import { Spinner } from "../spinner";

interface Props {
  children: React.ReactNode;
  inputDisabled?: boolean;
  onSubmit: (text: string) => void;
  loading?: boolean;
}

export const SessionWrapper = ({
  children,
  inputDisabled = false,
  onSubmit,
  loading = false,
}: Props) => {
  return (
    <box
      flexDirection="column"
      gap={1}
      flexGrow={1}
      width={150}
      height={"100%"}
      paddingY={1}
      paddingX={2}
    >
      <scrollbox flexGrow={1} width="100%" stickyScroll stickyStart="bottom">
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
        paddingY={1}
        paddingX={2}
        justifyContent="space-between"
        flexDirection="row"
        width={"100%"}
        gap={2}
        height={1}
      >
        <box alignItems="center" gap={1} flexDirection="row">
          {loading ? <Spinner /> : null}
        </box>
        <box
          alignItems="center"
          gap={1}
          flexDirection="row"
          flexShrink={0}
          marginLeft="auto"
        >
          <text>tabs</text>
          <text attributes={TextAttributes.DIM}>agents</text>
        </box>
      </box>
    </box>
  );
};