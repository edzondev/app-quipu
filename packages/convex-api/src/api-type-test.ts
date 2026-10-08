import type { FunctionReturnType } from "convex/server";
import type { api } from "./api.js";

type Overview = FunctionReturnType<typeof api.savings.getOverview>;
type EmergencyFundDetail = FunctionReturnType<typeof api.savings.getEmergencyFundDetail>;

// `0 extends (1 & T)` is true only for `any` (and types that contain it).
type IsAny<T> = 0 extends 1 & T ? true : false;
type Assert<T extends true> = T;

type _overviewIsNotAny = Assert<IsAny<Overview> extends false ? true : false>;
type _detailIsNotAny = Assert<IsAny<EmergencyFundDetail> extends false ? true : false>;

type _overviewCurrency = Assert<
	NonNullable<Overview>["profile"]["currencyCode"] extends string ? true : false
>;
