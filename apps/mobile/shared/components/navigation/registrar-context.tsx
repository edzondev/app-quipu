import { createContext, type ReactNode, useContext, useState } from "react";
import type { EditableExpense } from "@/shared/lib/movements/model";
import RegistrarSheet from "./registrar-sheet";

type Session = {
  nonce: number;
  expense: EditableExpense | null;
};

type RegistrarApi = {
  openCreate: () => void;
  openEdit: (expense: EditableExpense) => void;
};

const RegistrarContext = createContext<RegistrarApi | null>(null);

export function useRegistrar() {
  const api = useContext(RegistrarContext);
  if (!api) {
    throw new Error("useRegistrar debe usarse dentro de RegistrarProvider");
  }
  return api;
}

export function RegistrarProvider({ children }: { children: ReactNode }) {
  const [isPresented, setPresented] = useState(false);
  const [session, setSession] = useState<Session>({ nonce: 0, expense: null });

  function openCreate() {
    setSession((current) => ({ nonce: current.nonce + 1, expense: null }));
    setPresented(true);
  }

  function openEdit(expense: EditableExpense) {
    setSession((current) => ({ nonce: current.nonce + 1, expense }));
    setPresented(true);
  }

  return (
    <RegistrarContext.Provider value={{ openCreate, openEdit }}>
      {children}
      <RegistrarSheet
        isPresented={isPresented}
        session={session}
        onDismiss={() => setPresented(false)}
      />
    </RegistrarContext.Provider>
  );
}
