/**
 * Tablas de dominio Quipu (app), excluyendo Better Auth (componente).
 * Fuente única para reset, backup y resumen pre/post deploy.
 */
export const APP_DATA_TABLES = [
	"profiles",
	"financialCycles",
	"envelopes",
	"subEnvelopes",
	"fixedCommitments",
	"expenses",
	"coachInteractions",
	"streaks",
	"cycleHistory",
	"incomeEvents",
	"surplusContributions",
	"commitmentReservations",
	"incomeAllocationLines",
	"internalTransfers",
	"emailSendLog",
	"accountReviewFlags",
	"feedbackSubmissions",
	"financialSpaces",
	"spaceMembers",
	"spaceInvitations",
	"spaceCycles",
	"spaceEnvelopes",
	"spaceGoals",
	"spaceContributions",
	"spaceExpenses",
	"spaceCommitments",
	"spaceChangeProposals",
] as const;

export type AppDataTableName = (typeof APP_DATA_TABLES)[number];

/** Versión del JSON de snapshot; subir si cambia la forma del export. */
export const APP_DATA_SNAPSHOT_FORMAT = "quipu-app-snapshot-3" as const;
