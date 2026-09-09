import type { ExtraordinaryType, IncomeSource } from "./types";

export const HABITUAL_SOURCES: ReadonlyArray<{
  value: IncomeSource;
  label: string;
}> = [
  { value: "payroll", label: "Sueldo" },
  { value: "freelance", label: "Proyecto" },
  { value: "business", label: "Negocio" },
  { value: "refund", label: "Devolución" },
];

export const EXTRAORDINARY_TYPES: ReadonlyArray<{
  type: ExtraordinaryType;
  title: string;
}> = [
  { type: "gratification_july", title: "Gratificación de julio" },
  { type: "gratification_december", title: "Gratificación de diciembre" },
  { type: "cts", title: "CTS" },
  { type: "corporate_bonus", title: "Bono empresarial" },
  { type: "profit_sharing", title: "Utilidades" },
  { type: "custom", title: "Otro" },
];
