import { Mode } from "@code-sama/database";
import { useCallback, useState} from "react";
import { modeContext } from "./mode-context";

interface Props {
  children: React.ReactNode;
}

export const ModeProvider = ({ children }: Props) => {
  const [mode, setMode] = useState<Mode>(Mode.PLAN);

  const toggleMode = useCallback(() => {
    setMode((currentMode) =>
      currentMode === Mode.BUILD ? Mode.PLAN : Mode.BUILD,
    );
  }, []);

  return (
    <modeContext.Provider value={{ toggleMode, mode, setMode }}>
      {children}
    </modeContext.Provider>
  );
};
