import { TextAttributes } from "@opentui/core";
import { Spinner } from "../../spinner";

interface Props {
  loading: boolean;
}

export const SessionFooter = ({ loading}: Props) => {
  return (
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
            <text>Esc to interrupt</text>
          </>
        ) : null}
      </box>

      <box flexDirection="row" gap={1} flexShrink={0} marginLeft="auto">
        <text>tab</text>
        <text attributes={TextAttributes.DIM}>modes</text>
      </box>
    </box>
  );
};
