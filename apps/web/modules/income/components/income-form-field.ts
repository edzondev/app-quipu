import type { Updater } from "@tanstack/react-form";
import type { IncomeRegisterFormValues } from "../schemas";

/** Subset of TanStack FieldApi used by income register field components. */
export type IncomeFormField<TName extends keyof IncomeRegisterFormValues> = {
	name: string;
	state: {
		value: IncomeRegisterFormValues[TName];
		meta: {
			isTouched: boolean;
			isValid: boolean;
			errors: Array<{ message?: string } | undefined>;
		};
	};
	handleChange: (updater: Updater<IncomeRegisterFormValues[TName]>) => void;
	handleBlur: () => void;
};
