import { useCallback, useEffect, useRef } from "react";
import { useDialog } from "../../providers/dialog/dialog-context";
import { DialogSearchList } from "./dialog-search-list";
import type { InferResponseType } from "hono";
import { apiClient } from "../../lib/api-client";
import { useState } from "react";
import { getErrorMessage } from "../../lib/http-errors";
import { useToast } from "../../providers/toast/toast-context";
import { useNavigate } from "react-router";
import { TextAttributes } from "@opentui/core";
import { format } from "date-fns";

type Session = InferResponseType<(typeof apiClient.session)["$get"], 200>[0];

export const SessionDialog = () => {
  const [session, setSession] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();
  const { close } = useDialog();
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    const fetchSession = async () => {
      try {
        const res = await apiClient.session.$get();
        if (!res.ok) {
          throw new Error(await getErrorMessage(res));
        }
        const data = await res.json();
        setSession(data);
        setLoading(false);
      } catch (error) {
        if (!ignore) {
          show({
            variant: "error",
            message:
              error instanceof Error ? error.message : "failed to get session",
          });
          close();
        }
      }
    };

    fetchSession();

    return () => {
      ignore = true;
    };
  }, [close]);

  const handleSelect = useCallback(
    (session: Session) => {
      close();
      navigate(`/session/${session.id}`);
    },
    [close, navigate],
  );

  if (loading) {
    return (
      <box flexDirection="column">
        <text attributes={TextAttributes.DIM}>Loading sessions . . .</text>
      </box>
    );
  }

  return (
    <DialogSearchList
      items={session}
      placeholder="Select session..."
      emptyText="No matching items"
      getKey={(item) => item.title}
      filterFn={(item, query) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      }
      renderItem={(session, isSelected) => (
        <>
          <text selectable={false} fg={isSelected ? "black" : "white"}>
            {session.title}
          </text>
          <box flexGrow={1} />
          <text
            selectable={false}
            fg={isSelected ? "black" : undefined}
            attributes={TextAttributes.DIM}
          >
            {format(new Date(session.createdAt), "yyyy-MM-dd HH:mm:ss")}
          </text>
        </>
      )}
      onSelect={handleSelect}
    />
  );
};
