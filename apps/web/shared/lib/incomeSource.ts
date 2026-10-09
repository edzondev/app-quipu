export const INCOME_SOURCE_OPTIONS = [
	{ value: "payroll", label: "Sueldo" },
	{ value: "freelance", label: "Proyecto" },
	{ value: "business", label: "Negocio" },
	{ value: "gift", label: "Regalo" },
	{ value: "refund", label: "Devolución" },
	{ value: "investment", label: "Inversión" },
	{ value: "other", label: "Otro" },
] as const;

export type IncomeSourceOption = (typeof INCOME_SOURCE_OPTIONS)[number]["value"];

export function getIncomeSourceLabel(source: IncomeSourceOption): string {
	return INCOME_SOURCE_OPTIONS.find((option) => option.value === source)?.label ?? "Ingreso";
}
