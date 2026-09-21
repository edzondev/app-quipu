import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";

export const LANDING_EYEBROW = "Tu sueldo, con disciplina.";
export const LANDING_TITLE = "Divide tu dinero antes de gastarlo, no después.";
export const LANDING_BODY =
  "No es una app de cuentas ni un banco. Es un sistema para responder una sola pregunta, todos los días.";
export const LANDING_QUESTION = "¿Cuánto puedo gastar hoy sin arruinar mi mes?";
export const LANDING_PRIMARY_CTA = "Crear cuenta";
export const LANDING_SIGN_IN = "Ya tengo cuenta";
export const LANDING_HEADER_SIGN_IN = "Iniciar sesión";

export const LANDING_ENVELOPES_EYEBROW = "Los tres sobres";
export const LANDING_ENVELOPES_TITLE =
  "Todo lo que entra se reparte apenas llega.";
export const LANDING_ENVELOPES_BODY =
  "Lo registras tú. No hace falta conectar un banco.";
export const LANDING_ENVELOPES_NOTE =
  "Los porcentajes son tuyos: puedes cambiarlos cuando quieras.";

export const LANDING_ALLOCATION = [
  {
    label: ENVELOPE_LABELS.needs,
    desc: "Alquiler, servicios, comida",
    pct: "50%",
    width: 50,
    barColor: "bg-needs",
    dotClass: "bg-steel",
  },
  {
    label: ENVELOPE_LABELS.wants,
    desc: "Salidas, antojos, suscripciones",
    pct: "30%",
    width: 30,
    barColor: "bg-clay",
    dotClass: "bg-clay",
  },
  {
    label: ENVELOPE_LABELS.savings,
    desc: "Fondo de emergencia y metas",
    pct: "20%",
    width: 20,
    barColor: "bg-moss",
    dotClass: "bg-moss",
  },
] as const;

export const LANDING_RULES = [
  "Si gastas de más, mañana baja.",
  "Si gastas de menos, mañana sube.",
  "Tu ahorro no se toca.",
] as const;

export const LANDING_PREVIEW_CAPTION = "Así se ve un día en Quipu.";
export const LANDING_PREVIEW_LABEL = "Puedes gastar hoy";
export const LANDING_PREVIEW_CURRENCY = "PEN";
export const LANDING_PREVIEW_DAILY_CENTS = 4230;
export const LANDING_PREVIEW_DAYS_REMAINING = 18;
export const LANDING_PREVIEW_STATUS = "Estable";
export const LANDING_PREVIEW_BODY = "Hoy, sin comprometer el resto del ciclo.";

export const LANDING_PREVIEW_ENVELOPES = [
  {
    type: "needs" as const,
    label: ENVELOPE_LABELS.needs,
    remainingCents: 48000,
    allocatedCents: 120000,
    percent: 40,
    subcopy: "disponible",
    dotClass: "bg-steel",
    barClass: "bg-steel",
  },
  {
    type: "wants" as const,
    label: ENVELOPE_LABELS.wants,
    remainingCents: 28140,
    allocatedCents: 72000,
    percent: 39,
    subcopy: "disponible",
    dotClass: "bg-clay",
    barClass: "bg-clay",
  },
  {
    type: "savings" as const,
    label: ENVELOPE_LABELS.savings,
    remainingCents: 48000,
    allocatedCents: 48000,
    percent: 100,
    subcopy: "apartado",
    dotClass: "bg-moss",
    barClass: "bg-moss",
  },
] as const;

export const LANDING_FOOTER_NOTE = "Quipu no es un banco. No mueve tu dinero.";
