/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_investigation from "../admin/investigation.js";
import type * as admin_suspension from "../admin/suspension.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as coachEngine from "../coachEngine.js";
import type * as crons from "../crons.js";
import type * as crons_contentReviewScan from "../crons/contentReviewScan.js";
import type * as cycleCorrection from "../cycleCorrection.js";
import type * as cycleReport from "../cycleReport.js";
import type * as dashboard from "../dashboard.js";
import type * as expenses from "../expenses.js";
import type * as feedback from "../feedback.js";
import type * as fixedCommitments from "../fixedCommitments.js";
import type * as forecast from "../forecast.js";
import type * as http from "../http.js";
import type * as incomeEvents from "../incomeEvents.js";
import type * as lib_adminAuth from "../lib/adminAuth.js";
import type * as lib_appDataTables from "../lib/appDataTables.js";
import type * as lib_applyIncomeAllocation from "../lib/applyIncomeAllocation.js";
import type * as lib_authRateLimit from "../lib/authRateLimit.js";
import type * as lib_billingSync from "../lib/billingSync.js";
import type * as lib_budgetMath from "../lib/budgetMath.js";
import type * as lib_coachState from "../lib/coachState.js";
import type * as lib_commitmentCoverage from "../lib/commitmentCoverage.js";
import type * as lib_commitmentDueDate from "../lib/commitmentDueDate.js";
import type * as lib_commitmentPayment from "../lib/commitmentPayment.js";
import type * as lib_commitmentReservation from "../lib/commitmentReservation.js";
import type * as lib_contentFlags from "../lib/contentFlags.js";
import type * as lib_crisisPlan from "../lib/crisisPlan.js";
import type * as lib_crisisResolution from "../lib/crisisResolution.js";
import type * as lib_cycleCloseReport from "../lib/cycleCloseReport.js";
import type * as lib_cycleCorrection from "../lib/cycleCorrection.js";
import type * as lib_cycleForecast from "../lib/cycleForecast.js";
import type * as lib_cycleSavingsBreakdown from "../lib/cycleSavingsBreakdown.js";
import type * as lib_dashboardMath from "../lib/dashboardMath.js";
import type * as lib_defaultAllocationPlan from "../lib/defaultAllocationPlan.js";
import type * as lib_deployment from "../lib/deployment.js";
import type * as lib_email_authEmailLayout from "../lib/email/authEmailLayout.js";
import type * as lib_email_authEmailTokens from "../lib/email/authEmailTokens.js";
import type * as lib_email_authMail from "../lib/email/authMail.js";
import type * as lib_email_authTemplates from "../lib/email/authTemplates.js";
import type * as lib_email_domainPolicy from "../lib/email/domainPolicy.js";
import type * as lib_email_emailSendLog from "../lib/email/emailSendLog.js";
import type * as lib_email_feedbackMail from "../lib/email/feedbackMail.js";
import type * as lib_email_send from "../lib/email/send.js";
import type * as lib_entitlements from "../lib/entitlements.js";
import type * as lib_envelopeGuards from "../lib/envelopeGuards.js";
import type * as lib_evaluateClosedCycle from "../lib/evaluateClosedCycle.js";
import type * as lib_evaluateCommitmentCoverage from "../lib/evaluateCommitmentCoverage.js";
import type * as lib_extraordinaryIncome from "../lib/extraordinaryIncome.js";
import type * as lib_extraordinaryRules from "../lib/extraordinaryRules.js";
import type * as lib_extraordinarySavingsSurplus from "../lib/extraordinarySavingsSurplus.js";
import type * as lib_gamificationMath from "../lib/gamificationMath.js";
import type * as lib_incomeAllocation from "../lib/incomeAllocation.js";
import type * as lib_incomeDeleteReverse from "../lib/incomeDeleteReverse.js";
import type * as lib_incomeEventLogic from "../lib/incomeEventLogic.js";
import type * as lib_incomeHold from "../lib/incomeHold.js";
import type * as lib_inferredSavingsAnnulment from "../lib/inferredSavingsAnnulment.js";
import type * as lib_loadCycleCoverageContext from "../lib/loadCycleCoverageContext.js";
import type * as lib_markNeedsContentReview from "../lib/markNeedsContentReview.js";
import type * as lib_moneyInvariant from "../lib/moneyInvariant.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_rescueTransfer from "../lib/rescueTransfer.js";
import type * as lib_resetAppTables from "../lib/resetAppTables.js";
import type * as lib_reverseIncomeAllocationLedger from "../lib/reverseIncomeAllocationLedger.js";
import type * as lib_savingsAssignPlan from "../lib/savingsAssignPlan.js";
import type * as lib_savingsMath from "../lib/savingsMath.js";
import type * as lib_settingsCopy from "../lib/settingsCopy.js";
import type * as lib_spaceAuth from "../lib/spaceAuth.js";
import type * as lib_spaceAuthLogic from "../lib/spaceAuthLogic.js";
import type * as lib_spaceChangeProposalLogic from "../lib/spaceChangeProposalLogic.js";
import type * as lib_spaceContributionsLogic from "../lib/spaceContributionsLogic.js";
import type * as lib_spaceLifecycle from "../lib/spaceLifecycle.js";
import type * as lib_spaceParticipation from "../lib/spaceParticipation.js";
import type * as lib_spendableBalance from "../lib/spendableBalance.js";
import type * as lib_upcomingCommitments from "../lib/upcomingCommitments.js";
import type * as migrations_backfillCommitmentNextDueAt from "../migrations/backfillCommitmentNextDueAt.js";
import type * as migrations_backfillRequiredV25 from "../migrations/backfillRequiredV25.js";
import type * as migrations_markLegacyAllocationsForReview from "../migrations/markLegacyAllocationsForReview.js";
import type * as movements from "../movements.js";
import type * as polar from "../polar.js";
import type * as profiles from "../profiles.js";
import type * as progress from "../progress.js";
import type * as resetDb from "../resetDb.js";
import type * as savings from "../savings.js";
import type * as settings from "../settings.js";
import type * as spaceChangeProposals from "../spaceChangeProposals.js";
import type * as spaceCommitments from "../spaceCommitments.js";
import type * as spaceContributions from "../spaceContributions.js";
import type * as spaceCycles from "../spaceCycles.js";
import type * as spaceExpenses from "../spaceExpenses.js";
import type * as spaceGoals from "../spaceGoals.js";
import type * as spaceInvitations from "../spaceInvitations.js";
import type * as spaceMovements from "../spaceMovements.js";
import type * as spaces from "../spaces.js";
import type * as testing from "../testing.js";
import type * as upcomingCommitments from "../upcomingCommitments.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/investigation": typeof admin_investigation;
  "admin/suspension": typeof admin_suspension;
  auth: typeof auth;
  billing: typeof billing;
  coachEngine: typeof coachEngine;
  crons: typeof crons;
  "crons/contentReviewScan": typeof crons_contentReviewScan;
  cycleCorrection: typeof cycleCorrection;
  cycleReport: typeof cycleReport;
  dashboard: typeof dashboard;
  expenses: typeof expenses;
  feedback: typeof feedback;
  fixedCommitments: typeof fixedCommitments;
  forecast: typeof forecast;
  http: typeof http;
  incomeEvents: typeof incomeEvents;
  "lib/adminAuth": typeof lib_adminAuth;
  "lib/appDataTables": typeof lib_appDataTables;
  "lib/applyIncomeAllocation": typeof lib_applyIncomeAllocation;
  "lib/authRateLimit": typeof lib_authRateLimit;
  "lib/billingSync": typeof lib_billingSync;
  "lib/budgetMath": typeof lib_budgetMath;
  "lib/coachState": typeof lib_coachState;
  "lib/commitmentCoverage": typeof lib_commitmentCoverage;
  "lib/commitmentDueDate": typeof lib_commitmentDueDate;
  "lib/commitmentPayment": typeof lib_commitmentPayment;
  "lib/commitmentReservation": typeof lib_commitmentReservation;
  "lib/contentFlags": typeof lib_contentFlags;
  "lib/crisisPlan": typeof lib_crisisPlan;
  "lib/crisisResolution": typeof lib_crisisResolution;
  "lib/cycleCloseReport": typeof lib_cycleCloseReport;
  "lib/cycleCorrection": typeof lib_cycleCorrection;
  "lib/cycleForecast": typeof lib_cycleForecast;
  "lib/cycleSavingsBreakdown": typeof lib_cycleSavingsBreakdown;
  "lib/dashboardMath": typeof lib_dashboardMath;
  "lib/defaultAllocationPlan": typeof lib_defaultAllocationPlan;
  "lib/deployment": typeof lib_deployment;
  "lib/email/authEmailLayout": typeof lib_email_authEmailLayout;
  "lib/email/authEmailTokens": typeof lib_email_authEmailTokens;
  "lib/email/authMail": typeof lib_email_authMail;
  "lib/email/authTemplates": typeof lib_email_authTemplates;
  "lib/email/domainPolicy": typeof lib_email_domainPolicy;
  "lib/email/emailSendLog": typeof lib_email_emailSendLog;
  "lib/email/feedbackMail": typeof lib_email_feedbackMail;
  "lib/email/send": typeof lib_email_send;
  "lib/entitlements": typeof lib_entitlements;
  "lib/envelopeGuards": typeof lib_envelopeGuards;
  "lib/evaluateClosedCycle": typeof lib_evaluateClosedCycle;
  "lib/evaluateCommitmentCoverage": typeof lib_evaluateCommitmentCoverage;
  "lib/extraordinaryIncome": typeof lib_extraordinaryIncome;
  "lib/extraordinaryRules": typeof lib_extraordinaryRules;
  "lib/extraordinarySavingsSurplus": typeof lib_extraordinarySavingsSurplus;
  "lib/gamificationMath": typeof lib_gamificationMath;
  "lib/incomeAllocation": typeof lib_incomeAllocation;
  "lib/incomeDeleteReverse": typeof lib_incomeDeleteReverse;
  "lib/incomeEventLogic": typeof lib_incomeEventLogic;
  "lib/incomeHold": typeof lib_incomeHold;
  "lib/inferredSavingsAnnulment": typeof lib_inferredSavingsAnnulment;
  "lib/loadCycleCoverageContext": typeof lib_loadCycleCoverageContext;
  "lib/markNeedsContentReview": typeof lib_markNeedsContentReview;
  "lib/moneyInvariant": typeof lib_moneyInvariant;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/rescueTransfer": typeof lib_rescueTransfer;
  "lib/resetAppTables": typeof lib_resetAppTables;
  "lib/reverseIncomeAllocationLedger": typeof lib_reverseIncomeAllocationLedger;
  "lib/savingsAssignPlan": typeof lib_savingsAssignPlan;
  "lib/savingsMath": typeof lib_savingsMath;
  "lib/settingsCopy": typeof lib_settingsCopy;
  "lib/spaceAuth": typeof lib_spaceAuth;
  "lib/spaceAuthLogic": typeof lib_spaceAuthLogic;
  "lib/spaceChangeProposalLogic": typeof lib_spaceChangeProposalLogic;
  "lib/spaceContributionsLogic": typeof lib_spaceContributionsLogic;
  "lib/spaceLifecycle": typeof lib_spaceLifecycle;
  "lib/spaceParticipation": typeof lib_spaceParticipation;
  "lib/spendableBalance": typeof lib_spendableBalance;
  "lib/upcomingCommitments": typeof lib_upcomingCommitments;
  "migrations/backfillCommitmentNextDueAt": typeof migrations_backfillCommitmentNextDueAt;
  "migrations/backfillRequiredV25": typeof migrations_backfillRequiredV25;
  "migrations/markLegacyAllocationsForReview": typeof migrations_markLegacyAllocationsForReview;
  movements: typeof movements;
  polar: typeof polar;
  profiles: typeof profiles;
  progress: typeof progress;
  resetDb: typeof resetDb;
  savings: typeof savings;
  settings: typeof settings;
  spaceChangeProposals: typeof spaceChangeProposals;
  spaceCommitments: typeof spaceCommitments;
  spaceContributions: typeof spaceContributions;
  spaceCycles: typeof spaceCycles;
  spaceExpenses: typeof spaceExpenses;
  spaceGoals: typeof spaceGoals;
  spaceInvitations: typeof spaceInvitations;
  spaceMovements: typeof spaceMovements;
  spaces: typeof spaces;
  testing: typeof testing;
  upcomingCommitments: typeof upcomingCommitments;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
  polar: import("@convex-dev/polar/_generated/component.js").ComponentApi<"polar">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
