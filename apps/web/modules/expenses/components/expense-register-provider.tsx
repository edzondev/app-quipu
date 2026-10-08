"use client";

import type { ReactNode } from "react";
import { ExpenseRegisterContextProvider } from "../hooks/use-expense-register-context";
import { ExpenseRegisterFlow } from "./expense-register-flow";

export function ExpenseRegisterProvider({ children }: { children: ReactNode }) {
	return (
		<ExpenseRegisterContextProvider>
			{children}
			<ExpenseRegisterFlow />
		</ExpenseRegisterContextProvider>
	);
}
