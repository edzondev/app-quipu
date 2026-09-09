export const STATUS_BADGE_LABELS = {
  stable: "Estable",
  attention: "Atención",
  risk: "En riesgo",
  starting: "Recién empiezas",
} as const;

export const COACH_KIND_LABELS = {
  tranquil: "Tranquilo",
  warning: "Advertencia",
  crisis: "Crisis",
  suggestion: "Sugerencia",
  contigo: "Contigo",
} as const;

export const COACH_WARNING_ADJUST_CTA = "Ajustar ciclo";
export const COACH_WARNING_VIEW_CTA = "Ver en qué";
export const COACH_TRANQUIL_VIEW_CTA = "Ver detalle";
export const COACH_TRANQUIL_SAVE_MORE_CTA = "Guardar de más";
export const DASHBOARD_ENVELOPES_SECTION_ID = "dashboard-envelopes";

export const COMMITMENTS_COVERED_HEADER = "Todo está cubierto";
export const COMMITMENTS_UNCOVERED_HEADER = "Faltan por cubrir";

export const HERO_EMPTY_EYEBROW = "Tu espacio";
export const HERO_EMPTY_TITLE = "Tu sistema está listo";
export const HERO_EMPTY_BODY =
  "Registra tu primer ingreso para activar tu ciclo y ver cuánto puedes gastar hoy.";
export const HERO_EMPTY_CTA = "Registrar ingreso";

export const DASHBOARD_ERROR_TITLE = "No pudimos cargar tu dashboard";
export const DASHBOARD_ERROR_BODY =
  "Revisa tu conexión e intenta de nuevo en unos segundos.";
export const DASHBOARD_ERROR_RETRY = "Reintentar";

export const MOVEMENTS_SECTION_LABEL = "Movimientos recientes";
export const MOVEMENTS_VIEW_ALL = "Ver movimientos";
export const COMMITMENTS_VIEW_ALL = "Ver todo";

export const UPCOMING_COMMITMENTS_BADGE_ARIA = "Compromisos que vencen pronto";
export const UPCOMING_COMMITMENTS_VIEW_ALL = "Ver todos";
export const UPCOMING_COMMITMENTS_DUE_TODAY = "Vence hoy";
export const UPCOMING_COMMITMENTS_DUE_TOMORROW = "Vence mañana";
export const UPCOMING_COMMITMENTS_DUE_IN_DAYS = (days: number) =>
  `Vence en ${days} días`;

export const ENVELOPES_SECTION_LABEL = "Tus sobres";
export const COMMITMENTS_SECTION_LABEL = "Próximos compromisos";

export const HERO_AVAILABLE_LABEL = "Tu ritmo diario";
export const HERO_AVAILABLE_BODY =
  "Es lo que te queda en sobres repartido entre los días que faltan del ciclo.";
export const HERO_DAYS_REMAINING = "Días restantes";
export const HERO_CYCLE_HEALTH = "Salud del ciclo";
export const HERO_LIQUIDITY_SPENDABLE = "En sobres";
export const HERO_LIQUIDITY_RESERVED = "Reservado";
export const HERO_LIQUIDITY_UNALLOCATED = "Por repartir";
export const HERO_NEEDS_REVIEW_BANNER =
  "Si registraste cuánto tenías en vez de cuánto puedes usar, los números pueden estar inflados.";
export const HERO_NEEDS_REVIEW_CTA = "Corregir distribución";
export const HERO_CORRECT_HINT = "¿Los números no cuadran con tu dinero real?";
export const HERO_CORRECT_CTA = "Corregir ciclo";

export const ENVELOPE_EARLY_NEEDS_WANTS_SUBCOPY = "completo · aún sin gastos";
export const ENVELOPE_EARLY_SAVINGS_SUBCOPY =
  "meta del ciclo · aún por aportar";

export const COMMITMENTS_EMPTY_TITLE = "Aún no tienes compromisos";
export const COMMITMENTS_EMPTY_BODY =
  "Alquiler, luz, suscripciones. Quipu los aparta antes de que puedas gastarlos.";
export const COMMITMENTS_EMPTY_CTA = "+ Añadir compromiso";

export const COACH_EARLY_REGISTER_CTA = "Registrar primer gasto";
export const COACH_EARLY_VIEW_SYSTEM_CTA = "Ver mi sistema";

export const MOVEMENTS_EMPTY_BODY =
  "Tu primer movimiento aparecerá aquí. Registrar un gasto toma menos de diez segundos.";

export const DASHBOARD_SECONDARY_INSIGHTS_LABEL = "Predicción y vencimientos";
export const FORECAST_SECTION_LABEL = "Predicción";
export const FORECAST_EARLY_CYCLE_BODY =
  "La predicción estará lista después del tercer día del ciclo.";
export const FORECAST_DEPLETION_LINE = (
  envelopeLabel: string,
  calendarDay: number,
) => `Te quedas sin ${envelopeLabel} el día ${calendarDay}`;
export const FORECAST_SURPLUS_LINE = (envelopeLabel: string, amount: string) =>
  `Cierras con ${amount} de sobra en ${envelopeLabel}`;
export const FORECAST_DEFICIT_LINE = (envelopeLabel: string, amount: string) =>
  `Faltan ${amount} en ${envelopeLabel} al cierre`;
export const FORECAST_ALREADY_DEPLETED = (envelopeLabel: string) =>
  `${envelopeLabel} ya está en cero`;
export const FORECAST_PAYWALL_NUDGE =
  "Proyecta cuánto te durará tu dinero al ritmo actual.";
export const FORECAST_HEALTHY_TITLE = "Vas bien";
export const FORECAST_HEALTHY_BODY =
  "Aún no hay ritmo de gasto para proyectar el cierre. Sigue registrando y aquí verás cómo cierras el ciclo.";

export const REGISTER_CTA = "Registrar";

/** localStorage key prefix for dismissed cycle close reports */
export const CYCLE_CLOSE_REPORT_DISMISS_KEY = "quipu:cycle-close-report";

export const CYCLE_CLOSE_REPORT_EYEBROW = "Informe de cierre";
export const CYCLE_CLOSE_REPORT_TITLE = (cycleLabel: string) =>
  `Tu ciclo ${cycleLabel} cerró`;
export const CYCLE_CLOSE_REPORT_INCOME = "Entró";
export const CYCLE_CLOSE_REPORT_SPEND = "Gastaste por sobre";
export const CYCLE_CLOSE_REPORT_SAVINGS = "Apartaste en ahorro";
export const CYCLE_CLOSE_REPORT_STREAK = "Racha";
export const CYCLE_CLOSE_REPORT_STREAK_SUFFIX = (count: number) =>
  count === 1 ? "ciclo en orden" : "ciclos en orden";
export const CYCLE_CLOSE_REPORT_DISMISS = "Entendido";
export const CYCLE_CLOSE_REPORT_EXTRAORDINARY_HINT =
  "Incluye ingreso extraordinario";

/** Short income CTA in the dashboard header (mobile action row). */
export const INCOME_MOBILE_CTA = "+ Ingreso";
/** Desktop income CTA in the dashboard header. */
export const INCOME_DESKTOP_CTA = "Registrar ingreso";

export const COACH_SAVINGS_UNASSIGNED_PREFIX = "Tienes";
export const COACH_SAVINGS_UNASSIGNED_SUFFIX =
  "en tu sobre de ahorro sin destino.";
export const COACH_SAVINGS_UNASSIGNED_CTA = "Decidir destino";
