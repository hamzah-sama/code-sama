import { Mode, type ModeType } from "@code-sama/shared";
import { useCallback, useState} from "react";
import { modeContext } from "./mode-context";

interface Props {
  children: React.ReactNode;
}

export const ModeProvider = ({ children }: Props) => {
  const [mode, setMode] = useState<ModeType>(Mode.plan);

  const toggleMode = useCallback(() => {
    setMode((currentMode) =>
      currentMode === Mode.build ? Mode.plan : Mode.build,
    );
  }, []);

  return (
    <modeContext.Provider value={{ toggleMode, mode, setMode }}>
      {children}
    </modeContext.Provider>
  );
};
