import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
	computeCoverageProgressPercent,
	daysUntilNextDue,
	mapCoverageStatusToDashboard,
} from "./lib/commitmentCoverage";
import {
	computeInitialNextDueAt,
	computeNextDueAtAfterPayment,
	resolveCommitmentNextDueAt,
} from "./lib/commitmentDueDate";
import { isCommitmentPaidForCycle, resolveCommitmentPaymentStatus } from "./lib/commitmentPayment";
import { buildPaidSignalReservationPatches } from "./lib/commitmentReservation";
import { requireActiveAccount } from "./lib/entitlements";
import {
	buildCoverageByIdFromCycleDocs,
	loadCycleCoverageById,
} from "./lib/loadCycleCoverageContext";
import { markNeedsContentReviewIfSuspicious } from "./lib/markNeedsContentReview";

export const listMyCommitments = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) return [];

		return await ctx.db
			.query("fixedCommitments")
			.withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
			.collect();
	},
});

export const createFixedCommitment = mutation({
	args: {
		name: v.string(),
		amount: v.number(),
		envelope: v.union(v.literal("needs"), v.literal("wants")),
		dueDay: v.number(), // 1-31
	},
	handler: async (ctx, args) => {
		const profile = await requireActiveAccount(ctx);

		const name = args.name.trim();
		if (!name) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "El nombre del compromiso es obligatorio.",
				data: { field: "name" },
			});
		}
		if (!Number.isInteger(args.amount) || args.amount <= 0) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "El monto debe ser un entero de céntimos mayor a cero.",
				data: { field: "amount" },
			});
		}
		if (!Number.isInteger(args.dueDay) || args.dueDay < 1 || args.dueDay > 31) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "dueDay debe ser un entero entre 1 y 31.",
				data: { field: "dueDay" },
			});
		}

		const createdAt = Date.now();
		const nextDueAt = computeInitialNextDueAt(args.dueDay, createdAt);

		const commitmentId = await ctx.db.insert("fixedCommitments", {
			profileId: profile._id,
			name,
			amount: args.amount,
			envelope: args.envelope,
			dueDay: args.dueDay,
			nextDueAt,
		});
		await markNeedsContentReviewIfSuspicious(ctx, profile._id, [name]);
		return commitmentId;
	},
});

export const deleteFixedCommitment = mutation({
	args: { commitmentId: v.id("fixedCommitments") },
	handler: async (ctx, args) => {
		const profile = await requireActiveAccount(ctx);

		const commitment = await ctx.db.get(args.commitmentId);
		if (!commitment) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Compromiso no encontrado.",
			});
		}

		if (commitment.profileId !== profile._id) {
			throw new ConvexError({
				code: "FORBIDDEN",
				message: "No tienes permisos para eliminar este registro.",
			});
		}

		await ctx.db.delete(args.commitmentId);
		return { success: true };
	},
});

export const markCommitmentAsPaid = mutation({
	args: { commitmentId: v.id("fixedCommitments") },
	returns: v.object({ success: v.literal(true), paidAt: v.number() }),
	handler: async (ctx, args) => {
		const profile = await requireActiveAccount(ctx);

		const commitment = await ctx.db.get(args.commitmentId);
		if (!commitment) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Compromiso no encontrado.",
			});
		}

		if (commitment.profileId !== profile._id) {
			throw new ConvexError({
				code: "FORBIDDEN",
				message: "No tienes permisos para actualizar este registro.",
			});
		}

		const activeCycle = await ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
			.unique();
		if (!activeCycle) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Necesitas un ciclo activo para marcar un compromiso como pagado.",
			});
		}

		if (
			isCommitmentPaidForCycle(
				{
					paidAt: commitment.paidAt,
					paidForCycleId: commitment.paidForCycleId,
				},
				activeCycle._id,
			)
		) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Este compromiso ya está marcado como pagado en este ciclo.",
			});
		}

		const paidAt = Date.now();
		const currentNextDueAt = resolveCommitmentNextDueAt({
			dueDay: commitment.dueDay,
			nextDueAt: commitment.nextDueAt,
			createdAt: commitment._creationTime,
		});
		const nextDueAt = computeNextDueAtAfterPayment({
			currentNextDueAt,
			dueDay: commitment.dueDay,
			now: paidAt,
		});

		// I1 — Pagado es solo señal: libera reservas; no inventa gasto ni debita sobres.
		const reservations = await ctx.db
			.query("commitmentReservations")
			.withIndex("by_commitment_cycle", (q) =>
				q.eq("commitmentId", args.commitmentId).eq("cycleId", activeCycle._id),
			)
			.collect();
		const releasePatches = buildPaidSignalReservationPatches(
			reservations.map((row) => ({
				id: row._id,
				reservedCents: row.reservedCents,
				consumedCents: row.consumedCents,
				releasedCents: row.releasedCents,
				status: row.status,
			})),
		);

		await Promise.all(
			releasePatches.map(async (patch) => {
				await ctx.db.patch(patch.id as Id<"commitmentReservations">, {
					releasedCents: patch.releasedCents,
					status: patch.status,
					updatedAt: paidAt,
				});
				if (patch.returnedCents > 0) {
					await ctx.db.insert("internalTransfers", {
						profileId: profile._id,
						cycleId: activeCycle._id,
						kind: "reservation_release",
						amountCents: patch.returnedCents,
						from: `reservation:${patch.id}`,
						to: "paid_signal",
						note: `Liberación por marcado Pagado: ${commitment.name}`,
						createdAt: paidAt,
					});
				}
			}),
		);

		await ctx.db.patch(args.commitmentId, {
			paidAt,
			paidForCycleId: activeCycle._id,
			nextDueAt,
		});

		return { success: true as const, paidAt };
	},
});

/**
 * Crea N compromisos fijos en una sola mutation atómica.
 * Usado por el onboarding v2.5 (paso 6) para evitar N round-trips.
 *
 * Valida que todos los profileId coincidan con la sesión, que cada
 * name no esté vacío, cada amount sea entero positivo, y cada dueDay
 * esté en 1-31. Si alguna validación falla, ningún commitment se crea
 * (atomicidad de la mutation).
 */
export const createCommitmentsBulk = mutation({
	args: {
		profileId: v.id("profiles"),
		commitments: v.array(
			v.object({
				name: v.string(),
				amount: v.number(),
				envelope: v.union(v.literal("needs"), v.literal("wants")),
				dueDay: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const profile = await requireActiveAccount(ctx);
		if (args.profileId !== profile._id) {
			throw new ConvexError({
				code: "FORBIDDEN",
				message: "Perfil no encontrado o no autorizado.",
			});
		}

		// Valida todos antes de insertar (atomicidad).
		for (const [i, c] of args.commitments.entries()) {
			if (!c.name.trim()) {
				throw new ConvexError({
					code: "VALIDATION_ERROR",
					message: "El nombre del compromiso es obligatorio.",
					data: { field: `commitments[${i}].name` },
				});
			}
			if (!Number.isInteger(c.amount) || c.amount <= 0) {
				throw new ConvexError({
					code: "VALIDATION_ERROR",
					message: "El monto debe ser un entero de céntimos mayor a cero.",
					data: { field: `commitments[${i}].amount` },
				});
			}
			if (!Number.isInteger(c.dueDay) || c.dueDay < 1 || c.dueDay > 31) {
				throw new ConvexError({
					code: "VALIDATION_ERROR",
					message: "dueDay debe ser un entero entre 1 y 31.",
					data: { field: `commitments[${i}].dueDay` },
				});
			}
		}

		const createdAt = Date.now();
		const ids = await Promise.all(
			args.commitments.map((c) => {
				const nextDueAt = computeInitialNextDueAt(c.dueDay, createdAt);
				return ctx.db.insert("fixedCommitments", {
					profileId: args.profileId,
					name: c.name.trim(),
					amount: c.amount,
					envelope: c.envelope,
					dueDay: c.dueDay,
					nextDueAt,
				});
			}),
		);
		await markNeedsContentReviewIfSuspicious(
			ctx,
			profile._id,
			args.commitments.map((c) => c.name),
		);
		return ids;
	},
});

export const getCommitment = query({
	args: { commitmentId: v.id("fixedCommitments") },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const commitment = await ctx.db.get(args.commitmentId);
		if (!commitment) return null;

		const profile = await ctx.db.get(commitment.profileId);
		if (!profile || profile.userId !== identity.subject) return null;

		const now = Date.now();
		const activeCycle = await ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
			.unique();

		let coverageStatus: "covered" | "partial" | "uncovered" = "uncovered";
		const nextDueAt = resolveCommitmentNextDueAt({
			dueDay: commitment.dueDay,
			nextDueAt: commitment.nextDueAt,
			createdAt: commitment._creationTime,
		});
		if (activeCycle) {
			const [incomeEvents, reservationRows, envelopes] = await Promise.all([
				ctx.db
					.query("incomeEvents")
					.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
					.collect(),
				ctx.db
					.query("commitmentReservations")
					.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
					.collect(),
				ctx.db
					.query("envelopes")
					.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id))
					.collect(),
			]);
			const coverageById = buildCoverageByIdFromCycleDocs(
				{
					cycle: activeCycle,
					commitments: [commitment],
					incomeEvents,
					reservationRows,
					envelopes,
				},
				now,
			);
			const cascadeStatus = coverageById.get(commitment._id)?.status ?? "not-started";
			coverageStatus = mapCoverageStatusToDashboard(cascadeStatus);
		}

		const paymentStatus = resolveCommitmentPaymentStatus({
			paidAt: commitment.paidAt,
			paidForCycleId: commitment.paidForCycleId,
			activeCycleId: activeCycle?._id ?? null,
			nextDueAt,
			now,
		});

		return {
			id: commitment._id,
			name: commitment.name,
			amount: commitment.amount,
			envelope: commitment.envelope,
			dueDay: commitment.dueDay,
			nextDueAt,
			createdAt: commitment._creationTime,
			daysUntilDue: daysUntilNextDue(nextDueAt, now),
			coveredAt: commitment.coveredAt,
			coverageStatus,
			paymentStatus,
			paidAtForCycle: paymentStatus === "paid" ? commitment.paidAt : undefined,
			hasActiveCycle: activeCycle != null,
			currencyCode: profile.currencyCode,
		};
	},
});

export const getCommitmentCoverage = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) return null;

		const [activeCycle, commitments] = await Promise.all([
			ctx.db
				.query("financialCycles")
				.withIndex("by_profile_status", (q) =>
					q.eq("profileId", profile._id).eq("status", "active"),
				)
				.unique(),
			ctx.db
				.query("fixedCommitments")
				.withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
				.collect(),
		]);

		const now = Date.now();

		if (!activeCycle) {
			const totalCents = commitments.reduce((sum, c) => sum + c.amount, 0);
			return {
				currencyCode: profile.currencyCode,
				cycle: null,
				cycleId: null,
				totalCents,
				commitments: commitments.map((commitment) => {
					const nextDueAt = resolveCommitmentNextDueAt({
						dueDay: commitment.dueDay,
						nextDueAt: commitment.nextDueAt,
						createdAt: commitment._creationTime,
					});
					return {
						id: commitment._id,
						name: commitment.name,
						amount: commitment.amount,
						envelope: commitment.envelope,
						dueDay: commitment.dueDay,
						daysUntilDue: daysUntilNextDue(nextDueAt, now),
						nextDueAt,
						covered: 0,
						remaining: commitment.amount,
						progressPercent: 0,
						coverageStatus: "uncovered" as const,
						cascadeStatus: "not-started" as const,
						fundingEvents: [],
						coveredAt: commitment.coveredAt,
						paymentStatus: resolveCommitmentPaymentStatus({
							paidAt: commitment.paidAt,
							paidForCycleId: commitment.paidForCycleId,
							activeCycleId: null,
							nextDueAt,
							now,
						}),
						paidAtForCycle: undefined,
					};
				}),
			};
		}

		const coverageContext = await loadCycleCoverageById(ctx, profile._id, activeCycle._id, now);
		const coverageById = coverageContext?.coverageById ?? new Map();
		const coveredCommitments = coverageContext?.commitments ?? commitments;

		const totalCents = coveredCommitments.reduce((sum, c) => sum + c.amount, 0);

		return {
			currencyCode: profile.currencyCode,
			cycle: {
				startDate: activeCycle.startDate,
				endDate: activeCycle.endDate,
			},
			cycleId: activeCycle._id,
			totalCents,
			commitments: coveredCommitments
				.map((commitment) => {
					const nextDueAt = resolveCommitmentNextDueAt({
						dueDay: commitment.dueDay,
						nextDueAt: commitment.nextDueAt,
						createdAt: commitment._creationTime,
					});
					const coverage = coverageById.get(commitment._id);
					const covered = coverage?.covered ?? 0;
					const remaining = coverage?.remaining ?? commitment.amount;
					const cascadeStatus = coverage?.status ?? "not-started";
					const paymentStatus = resolveCommitmentPaymentStatus({
						paidAt: commitment.paidAt,
						paidForCycleId: commitment.paidForCycleId,
						activeCycleId: activeCycle._id,
						nextDueAt,
						now,
					});

					return {
						id: commitment._id,
						name: commitment.name,
						amount: commitment.amount,
						envelope: commitment.envelope,
						dueDay: commitment.dueDay,
						nextDueAt,
						daysUntilDue: daysUntilNextDue(nextDueAt, now),
						covered,
						remaining,
						progressPercent: computeCoverageProgressPercent(covered, commitment.amount),
						coverageStatus: mapCoverageStatusToDashboard(cascadeStatus),
						cascadeStatus,
						fundingEvents: coverage?.fundingEvents ?? [],
						coveredAt: commitment.coveredAt,
						paymentStatus,
						paidAtForCycle: paymentStatus === "paid" ? commitment.paidAt : undefined,
					};
				})
				.sort((a, b) => a.daysUntilDue - b.daysUntilDue),
		};
	},
});
