/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as coach from "../coach.js";
import type * as envelopes from "../envelopes.js";
import type * as expenses from "../expenses.js";
import type * as extraIncomes from "../extraIncomes.js";
import type * as fixedCommitments from "../fixedCommitments.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as pauseMode from "../pauseMode.js";
import type * as payday from "../payday.js";
import type * as polar from "../polar.js";
import type * as profiles from "../profiles.js";
import type * as rescue from "../rescue.js";
import type * as runtimeEnv from "../runtimeEnv.js";
import type * as savings from "../savings.js";
import type * as specialIncomes from "../specialIncomes.js";
import type * as streaks from "../streaks.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  coach: typeof coach;
  envelopes: typeof envelopes;
  expenses: typeof expenses;
  extraIncomes: typeof extraIncomes;
  fixedCommitments: typeof fixedCommitments;
  helpers: typeof helpers;
  http: typeof http;
  pauseMode: typeof pauseMode;
  payday: typeof payday;
  polar: typeof polar;
  profiles: typeof profiles;
  rescue: typeof rescue;
  runtimeEnv: typeof runtimeEnv;
  savings: typeof savings;
  specialIncomes: typeof specialIncomes;
  streaks: typeof streaks;
  subscriptions: typeof subscriptions;
  users: typeof users;
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
};
