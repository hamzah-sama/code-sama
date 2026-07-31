import { useCallback, useRef, useState, type ReactNode } from "react";
import type { Responder } from "./types";
import { useKeyboard } from "@opentui/react";
import { layerContext } from "./layer-context";

interface Props {
  children: ReactNode;
}

export const LayerProvider = ({ children }: Props) => {
  const [layerStack, setLayerStack] = useState<string[]>(["base"]);
  const stackRef = useRef(layerStack);
  stackRef.current = layerStack;

  const responders = useRef<Map<string, Responder>>(new Map());

  const push = useCallback((layerName: string, responder?: Responder) => {
    if (responder) {
      responders.current.set(layerName, responder);
    }

    setLayerStack((currentStack) =>
      currentStack.includes(layerName)
        ? currentStack
        : [...currentStack, layerName],
    );
  }, []);

  const pop = useCallback((layerName: string) => {
    responders.current.delete(layerName);

    setLayerStack((currentStack) =>
      currentStack.filter((layer) => layer !== layerName),
    );
  }, []);

  const isTopLayer = useCallback(
    (layerName: string) => {
      return layerStack.at(-1) === layerName;
    },
    [layerStack],
  );

  const setResponder = useCallback(
    (layerName: string, responder?: Responder | null) => {
      if (responder) {
        responders.current.set(layerName, responder);
      } else {
        responders.current.delete(layerName);
      }
    },
    [],
  );

  useKeyboard((key) => {
    if (!key.ctrl || key.name !== "c") return;
    const currentStack = stackRef.current;

    for (let i = currentStack.length - 1; i >= 0; i--) {
      const currentLayerName = currentStack[i]!;
      const responder = responders.current.get(currentLayerName);
      if (responder?.()) return;
    }
  });

  return (
    <layerContext.Provider value={{ push, pop, isTopLayer, setResponder }}>
      {children}
    </layerContext.Provider>
  );
};
