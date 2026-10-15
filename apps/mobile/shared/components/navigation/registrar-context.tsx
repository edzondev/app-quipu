import { useRouter } from "expo-router";
import { createContext, type ReactNode, useContext, useState } from "react";
import type { EditableExpense } from "@/shared/lib/movements/model";
import type { RegistrarIntent } from "@/shared/lib/navigation/registrar-mode";
import RegistrarSheet from "./registrar-sheet";

type Session = {
	nonce: number;
	intent: RegistrarIntent;
};

type RegistrarApi = {
	openCreate: (intent?: RegistrarIntent) => void;
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
	const router = useRouter();
	const [isPresented, setPresented] = useState(false);
	const [session, setSession] = useState<Session>({ nonce: 0, intent: "auto" });

	function openCreate(intent: RegistrarIntent = "auto") {
		const next: RegistrarIntent = intent === "income" || intent === "expense" ? intent : "auto";
		setSession((current) => ({ nonce: current.nonce + 1, intent: next }));
		setPresented(true);
	}

	function openEdit(expense: EditableExpense) {
		router.push(`/expense/${expense.id}`);
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
