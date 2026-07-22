import { TextAttributes } from "@opentui/core";
import { InputBar } from "../input-bar";
import { Spinner } from "../spinner";

interface Props {
  children?: React.ReactNode;
  inputDisabled?: boolean;
  onSubmit: (text: string) => void;
  loading?: boolean;
}

export const SessionWrapper = ({
  children,
  inputDisabled = false,
  onSubmit,
  loading
}: Props) => {
  return (
    <box
      flexDirection="column"
      gap={1}
      flexGrow={1}
      width='100%'
      height="100%"
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
              <Spinner  />
            </>
          ) : null}
        </box>

        <box flexDirection="row" gap={1} flexShrink={0} marginLeft="auto">
          <text>tab</text>
          <text attributes={TextAttributes.DIM}>agents</text>
        </box>
      </box>
    </box>
  );
};