import { createContext, type ReactNode, useContext } from "react";

export type RegistrarView = "expense" | "income";

type RegistrarSheetApi = {
  open: (view?: RegistrarView) => void;
};

const RegistrarSheetContext = createContext<RegistrarSheetApi | null>(null);

export function RegistrarSheetProvider({
  open,
  children,
}: {
  open: (view?: RegistrarView) => void;
  children: ReactNode;
}) {
  return (
    <RegistrarSheetContext.Provider value={{ open }}>
      {children}
    </RegistrarSheetContext.Provider>
  );
}

export function useRegistrarSheet(): RegistrarSheetApi {
  const ctx = useContext(RegistrarSheetContext);
  if (!ctx) {
    return { open: () => undefined };
  }
  return ctx;
}
