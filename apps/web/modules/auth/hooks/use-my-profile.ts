"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/** Client profile for the signed-in user (null = no onboarding profile yet). */
export function useMyProfile() {
	return useQuery(api.profiles.getMyProfile, {});
}
