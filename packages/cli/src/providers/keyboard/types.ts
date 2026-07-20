export type Responder = () => boolean;
export type KeyboardContextValue = {
  push: (layerName: string, responder?: Responder) => void;
  pop: (layerName: string) => void;
  isTopLayer: (layerName: string) => boolean;
  setResponder: (layerName: string, responder: Responder | null) => void;
};
